#!/usr/bin/env python3
"""
Marketing Analysis Strategy Department - Web Interface
Simple web interface for monitoring and controlling the agent network.
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import requests
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Marketing Analysis Web Interface", version="1.0.0")
templates = Jinja2Templates(directory="templates")

# Use Docker service name for orchestrator
ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://orchestrator:8000")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with system overview."""
    try:
        # Get agent status
        logger.info(f"Fetching agents from {ORCHESTRATOR_URL}/agents")
        response = requests.get(f"{ORCHESTRATOR_URL}/agents", timeout=5)
        logger.info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            agents = response.json()
            logger.info(f"Retrieved {len(agents)} agents: {[agent.get('agent_id', 'unknown') for agent in agents]}")
        else:
            logger.error(f"Failed to get agents: {response.status_code}")
            agents = []
    except Exception as e:
        logger.error(f"Error fetching agents: {e}")
        agents = []
    
    # Ensure agents is a list
    if not isinstance(agents, list):
        agents = []
    
    # Calculate system status
    available_agents = len([a for a in agents if a.get('status') == 'available'])
    busy_agents = len([a for a in agents if a.get('status') == 'busy'])
    
    system_status = "Online" if agents else "Offline"
    
    logger.info(f"Rendering template with {len(agents)} agents, system_status: {system_status}")
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "agents": agents,
        "system_status": system_status,
        "total_agents": len(agents),
        "available_agents": available_agents,
        "busy_agents": busy_agents
    })

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "web_interface"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) 