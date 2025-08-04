#!/usr/bin/env python3
"""
Marketing Analysis Strategy Department - Agent Orchestrator
Manages the graph-based agent network and coordinates tasks between agents.
"""

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import requests
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class TaskRequest(BaseModel):
    task_type: str
    target_url: str
    analysis_scope: List[str]
    priority: str = "medium"

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

class AgentStatus(BaseModel):
    agent_id: str
    agent_type: str
    status: str
    current_task: Optional[str]
    capabilities: List[str]

class Orchestrator:
    def __init__(self):
        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        
        # Initialize Neo4j driver with retry logic
        self.driver = None
        self._initialize_neo4j_connection()
        
        # Agent registry
        self.agents = {
            "research": {"status": "available", "current_task": None},
            "analysis": {"status": "available", "current_task": None},
            "strategy": {"status": "available", "current_task": None},
            "report": {"status": "available", "current_task": None}
        }
        
        # Initialize graph database
        self._initialize_graph()
    
    def _initialize_neo4j_connection(self):
        """Initialize Neo4j connection with retry logic."""
        max_retries = 30
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting to connect to Neo4j (attempt {attempt + 1}/{max_retries})")
                self.driver = GraphDatabase.driver(
                    self.neo4j_uri,
                    auth=(self.neo4j_user, self.neo4j_password)
                )
                
                # Test the connection
                with self.driver.session() as session:
                    session.run("RETURN 1")
                
                logger.info("Successfully connected to Neo4j")
                break
                
            except ServiceUnavailable as e:
                logger.warning(f"Neo4j connection failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    logger.error("Failed to connect to Neo4j after all retries")
                    raise
            except Exception as e:
                logger.error(f"Unexpected error connecting to Neo4j: {e}")
                raise
    
    def _initialize_graph(self):
        """Initialize the graph database with agent nodes and relationships."""
        try:
            with self.driver.session() as session:
                # Create agent nodes
                for agent_type in self.agents.keys():
                    session.run("""
                        MERGE (a:Agent {
                            id: $agent_id,
                            type: $agent_type,
                            status: $status,
                            capabilities: $capabilities,
                            current_task: $current_task
                        })
                    """, {
                        "agent_id": f"{agent_type}_agent",
                        "agent_type": agent_type,
                        "status": "available",
                        "capabilities": self._get_agent_capabilities(agent_type),
                        "current_task": ""
                    })
                
                # Create coordination agent
                session.run("""
                    MERGE (a:Agent {
                        id: 'coordination_agent',
                        type: 'coordination',
                        status: 'available',
                        capabilities: ['task_distribution', 'workflow_management'],
                        current_task: ''
                    })
                """)
                
                # Create relationships between coordination agent and other agents
                for agent_type in self.agents.keys():
                    session.run("""
                        MATCH (coord:Agent {id: 'coordination_agent'})
                        MATCH (agent:Agent {id: $agent_id})
                        MERGE (coord)-[:COORDINATES]->(agent)
                    """, {"agent_id": f"{agent_type}_agent"})
                    
            logger.info("Graph database initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing graph database: {e}")
            raise
    
    def _get_agent_capabilities(self, agent_type: str) -> List[str]:
        """Get capabilities for a specific agent type."""
        capabilities = {
            "research": ["web_scraping", "data_collection", "market_research"],
            "analysis": ["data_processing", "pattern_recognition", "insights_generation"],
            "strategy": ["strategy_formulation", "competitive_analysis", "recommendations"],
            "report": ["report_generation", "latex_formatting", "visualization"]
        }
        return capabilities.get(agent_type, [])
    
    async def create_task(self, task_request: TaskRequest) -> TaskResponse:
        """Create a new task and distribute it to appropriate agents."""
        task_id = str(uuid.uuid4())
        
        # Create task node in graph
        with self.driver.session() as session:
            session.run("""
                CREATE (t:Task {
                    id: $task_id,
                    type: $task_type,
                    status: 'pending',
                    priority: $priority,
                    target_url: $target_url,
                    analysis_scope: $analysis_scope,
                    created_at: datetime()
                })
            """, {
                "task_id": task_id,
                "task_type": task_request.task_type,
                "priority": task_request.priority,
                "target_url": task_request.target_url,
                "analysis_scope": task_request.analysis_scope
            })
            
            # Assign task to coordination agent
            session.run("""
                MATCH (coord:Agent {id: 'coordination_agent'})
                MATCH (task:Task {id: $task_id})
                MERGE (coord)-[:ASSIGNED_TO]->(task)
            """, {"task_id": task_id})
        
        # Start workflow
        await self._start_workflow(task_id, task_request)
        
        return TaskResponse(
            task_id=task_id,
            status="started",
            message=f"Task {task_id} created and workflow started"
        )
    
    async def _start_workflow(self, task_id: str, task_request: TaskRequest):
        """Start the workflow for a given task."""
        try:
            # Phase 1: Research
            research_task = await self._assign_task_to_agent(
                "research", task_id, "web_scraping", {
                    "target_url": task_request.target_url,
                    "scope": task_request.analysis_scope
                }
            )
            
            # Phase 2: Analysis (depends on research)
            analysis_task = await self._assign_task_to_agent(
                "analysis", task_id, "data_analysis", {
                    "depends_on": research_task,
                    "scope": task_request.analysis_scope
                }
            )
            
            # Phase 3: Strategy (depends on analysis)
            strategy_task = await self._assign_task_to_agent(
                "strategy", task_id, "strategy_formulation", {
                    "depends_on": analysis_task,
                    "scope": task_request.analysis_scope
                }
            )
            
            # Phase 4: Report (depends on strategy)
            await self._assign_task_to_agent(
                "report", task_id, "report_generation", {
                    "depends_on": strategy_task,
                    "scope": task_request.analysis_scope
                }
            )
            
            logger.info(f"Workflow started for task {task_id}")
            
        except Exception as e:
            logger.error(f"Error starting workflow for task {task_id}: {e}")
            raise
    
    async def _assign_task_to_agent(self, agent_type: str, task_id: str, 
                                   task_type: str, parameters: Dict) -> str:
        """Assign a task to a specific agent."""
        subtask_id = str(uuid.uuid4())
        
        # Create subtask in graph
        with self.driver.session() as session:
            session.run("""
                CREATE (st:SubTask {
                    id: $subtask_id,
                    type: $task_type,
                    status: 'pending',
                    parameters: $parameters,
                    created_at: datetime()
                })
            """, {
                "subtask_id": subtask_id,
                "task_type": task_type,
                "parameters": json.dumps(parameters)
            })
            
            # Link subtask to main task
            session.run("""
                MATCH (task:Task {id: $task_id})
                MATCH (subtask:SubTask {id: $subtask_id})
                MERGE (task)-[:CONTAINS]->(subtask)
            """, {
                "task_id": task_id,
                "subtask_id": subtask_id
            })
            
            # Assign to agent
            session.run("""
                MATCH (agent:Agent {id: $agent_id})
                MATCH (subtask:SubTask {id: $subtask_id})
                MERGE (agent)-[:ASSIGNED_TO]->(subtask)
            """, {
                "agent_id": f"{agent_type}_agent",
                "subtask_id": subtask_id
            })
        
        # Send task to agent via HTTP
        await self._send_task_to_agent(agent_type, subtask_id, task_type, parameters)
        
        return subtask_id
    
    async def _send_task_to_agent(self, agent_type: str, subtask_id: str, 
                                 task_type: str, parameters: Dict):
        """Send task to agent via HTTP API."""
        agent_url = f"http://marketing_analysis_{agent_type}_agent:8000/task"
        
        # Format payload based on agent type
        if agent_type == "research":
            payload = {
                "task_id": subtask_id,
                "target_url": parameters.get("target_url", ""),
                "analysis_scope": parameters.get("analysis_scope", []),
                "priority": parameters.get("priority", "medium")
            }
        else:
            # Default format for other agents
            payload = {
                "subtask_id": subtask_id,
                "task_type": task_type,
                "parameters": parameters
            }
        
        try:
            response = requests.post(agent_url, json=payload, timeout=120)  # Increased timeout to 120 seconds
            response.raise_for_status()
            logger.info(f"Task {subtask_id} sent to {agent_type} agent")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending task to {agent_type} agent: {e}")
            raise
    
    def get_agent_status(self) -> List[AgentStatus]:
        """Get status of all agents."""
        status_list = []
        
        with self.driver.session() as session:
            result = session.run("""
                MATCH (a:Agent)
                RETURN a.agent_id as id, a.agent_type as type, a.status as status, 
                       a.current_task as current_task, a.capabilities as capabilities
            """)
            
            for record in result:
                # Handle null values and provide defaults
                agent_id = record["id"] or "unknown"
                agent_type = record["type"] or "unknown"
                status = record["status"] or "unknown"
                current_task = record["current_task"] or ""
                capabilities = record["capabilities"] or []
                
                # Ensure capabilities is a list
                if not isinstance(capabilities, list):
                    capabilities = []
                
                status_list.append(AgentStatus(
                    agent_id=agent_id,
                    agent_type=agent_type,
                    status=status,
                    current_task=current_task,
                    capabilities=capabilities
                ))
        
        return status_list
    
    def get_task_status(self, task_id: str) -> Dict:
        """Get status of a specific task."""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (task:Task {id: $task_id})
                OPTIONAL MATCH (task)-[:CONTAINS]->(subtask:SubTask)
                RETURN task, collect(subtask) as subtasks
            """, {"task_id": task_id})
            
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail="Task not found")
            
            task = record["task"]
            subtasks = record["subtasks"]
            
            return {
                "task_id": task["id"],
                "status": task["status"],
                "type": task["type"],
                "created_at": task["created_at"],
                "subtasks": [
                    {
                        "id": st["id"],
                        "type": st["type"],
                        "status": st["status"]
                    } for st in subtasks if st is not None
                ]
            }

# FastAPI app
app = FastAPI(title="Marketing Analysis Orchestrator", version="1.0.0")
orchestrator = Orchestrator()

@app.post("/task", response_model=TaskResponse)
async def create_task(task_request: TaskRequest):
    """Create a new marketing analysis task."""
    return await orchestrator.create_task(task_request)

@app.get("/agents", response_model=List[AgentStatus])
async def get_agents():
    """Get status of all agents."""
    return orchestrator.get_agent_status()

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a specific task."""
    return orchestrator.get_task_status(task_id)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 