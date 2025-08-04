#!/usr/bin/env python3
"""
Research Agent for Marketing Analysis Strategy Department
Specializes in web scraping, data collection, and market research.
"""

import os
import json
import logging
import requests
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Research Agent", version="1.0.0")

# Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
RESEARCH_STORAGE_URL = os.getenv("RESEARCH_STORAGE_URL", "http://localhost:8001")
AGENT_ID = "research_agent"

class TaskRequest(BaseModel):
    task_id: str
    target_url: str
    analysis_scope: List[str]
    priority: str = "medium"

class TaskResponse(BaseModel):
    task_id: str
    status: str
    results: Dict[str, Any]
    message: str

def _initialize_neo4j_connection():
    """Initialize Neo4j connection with retry logic."""
    from neo4j import GraphDatabase
    import time
    
    max_retries = 10
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            # Test connection
            with driver.session() as session:
                session.run("RETURN 1")
            logger.info("Successfully connected to Neo4j")
            return driver
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed to connect to Neo4j: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 1.5
            else:
                logger.error("Failed to connect to Neo4j after all retries")
                raise

def _store_research_data(task_id: str, data_type: str, content: Dict[str, Any]):
    """Store research data in the research storage service."""
    try:
        research_data = {
            "agent_id": AGENT_ID,
            "task_id": task_id,
            "data_type": data_type,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "agent_type": "research",
                "target_url": content.get("target_url", ""),
                "analysis_scope": content.get("analysis_scope", [])
            }
        }
        
        response = requests.post(
            f"{RESEARCH_STORAGE_URL}/api/data",
            json=research_data,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully stored {data_type} data")
            return True
        else:
            logger.error(f"Failed to store research data: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Error storing research data: {e}")
        return False

def _scrape_website(url: str) -> Dict[str, Any]:
    """Scrape website content and extract relevant information."""
    try:
        import requests
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin, urlparse
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract basic information
        title = soup.find('title')
        title_text = title.get_text() if title else "No title found"
        
        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        description = meta_desc.get('content') if meta_desc else "No description found"
        
        # Extract headings
        headings = []
        for tag in ['h1', 'h2', 'h3']:
            for heading in soup.find_all(tag):
                headings.append({
                    'level': tag,
                    'text': heading.get_text().strip()
                })
        
        # Extract links
        links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            text = link.get_text().strip()
            if href and text:
                links.append({
                    'url': urljoin(url, href),
                    'text': text
                })
        
        # Extract images
        images = []
        for img in soup.find_all('img'):
            src = img.get('src')
            alt = img.get('alt', '')
            if src:
                images.append({
                    'src': urljoin(url, src),
                    'alt': alt
                })
        
        # Extract text content
        text_content = []
        for paragraph in soup.find_all(['p', 'div']):
            text = paragraph.get_text().strip()
            if text and len(text) > 50:  # Only meaningful content
                text_content.append(text)
        
        return {
            "target_url": url,
            "title": title_text,
            "description": description,
            "headings": headings[:10],  # Limit to first 10 headings
            "links": links[:20],  # Limit to first 20 links
            "images": images[:10],  # Limit to first 10 images
            "text_content": text_content[:20],  # Limit to first 20 paragraphs
            "scraped_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error scraping website {url}: {e}")
        return {
            "target_url": url,
            "error": str(e),
            "scraped_at": datetime.now().isoformat()
        }

def _analyze_bcd_website(url: str) -> Dict[str, Any]:
    """Analyze Better Call Dominik website specifically."""
    try:
        scraped_data = _scrape_website(url)
        
        # Analyze the scraped data
        analysis = {
            "website_analysis": {
                "url": url,
                "title": scraped_data.get("title", ""),
                "description": scraped_data.get("description", ""),
                "content_structure": {
                    "headings_count": len(scraped_data.get("headings", [])),
                    "links_count": len(scraped_data.get("links", [])),
                    "images_count": len(scraped_data.get("images", [])),
                    "text_paragraphs": len(scraped_data.get("text_content", []))
                },
                "marketing_elements": {
                    "has_call_to_action": any("contact" in link.get("text", "").lower() for link in scraped_data.get("links", [])),
                    "has_social_media": any("facebook" in link.get("url", "").lower() or "twitter" in link.get("url", "").lower() for link in scraped_data.get("links", [])),
                    "has_contact_info": any("contact" in link.get("text", "").lower() or "email" in link.get("text", "").lower() for link in scraped_data.get("links", []))
                }
            },
            "content_analysis": {
                "main_topics": [h.get("text", "") for h in scraped_data.get("headings", [])[:5]],
                "key_phrases": [],
                "content_quality": "high" if len(scraped_data.get("text_content", [])) > 5 else "medium"
            },
            "technical_analysis": {
                "has_meta_description": bool(scraped_data.get("description")),
                "has_structured_content": len(scraped_data.get("headings", [])) > 0,
                "has_images": len(scraped_data.get("images", [])) > 0
            }
        }
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing BCD website: {e}")
        return {
            "error": str(e),
            "url": url
        }

@app.post("/task", response_model=TaskResponse)
async def process_task(task_request: TaskRequest):
    """Process a research task."""
    try:
        logger.info(f"Processing research task: {task_request.task_id}")
        
        # Initialize Neo4j connection
        driver = _initialize_neo4j_connection()
        
        # Update agent status in Neo4j
        with driver.session() as session:
            session.run("""
                MERGE (a:Agent {agent_id: $agent_id})
                SET a.status = 'busy', a.current_task = $task_id
            """, agent_id=AGENT_ID, task_id=task_request.task_id)
        
        # Perform research based on task
        if "bettercalldominik.com" in task_request.target_url.lower():
            research_results = _analyze_bcd_website(task_request.target_url)
        else:
            research_results = _scrape_website(task_request.target_url)
        
        # Store research data
        _store_research_data(
            task_request.task_id,
            "scraped_data",
            {
                "target_url": task_request.target_url,
                "analysis_scope": task_request.analysis_scope,
                "research_results": research_results
            }
        )
        
        # Update agent status back to available
        with driver.session() as session:
            session.run("""
                MERGE (a:Agent {agent_id: $agent_id})
                SET a.status = 'available', a.current_task = ''
            """, agent_id=AGENT_ID)
        
        driver.close()
        
        return TaskResponse(
            task_id=task_request.task_id,
            status="completed",
            results=research_results,
            message="Research completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error processing research task: {e}")
        
        # Update agent status back to available on error
        try:
            driver = _initialize_neo4j_connection()
            with driver.session() as session:
                session.run("""
                    MERGE (a:Agent {agent_id: $agent_id})
                    SET a.status = 'available', a.current_task = ''
                """, agent_id=AGENT_ID)
            driver.close()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Research task failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent_id": AGENT_ID}

@app.get("/")
async def root():
    """Root endpoint."""
    return {"agent_id": AGENT_ID, "type": "research", "status": "available"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 