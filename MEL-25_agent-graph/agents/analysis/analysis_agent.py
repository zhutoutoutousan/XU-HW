#!/usr/bin/env python3
"""
Analysis Agent for Marketing Analysis Strategy Department
Specializes in data processing, pattern recognition, and insights generation.
"""

import os
import json
import logging
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Analysis Agent", version="1.0.0")

# Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
RESEARCH_STORAGE_URL = os.getenv("RESEARCH_STORAGE_URL", "http://localhost:8001")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-xxx")
AGENT_ID = "analysis_agent"

class TaskRequest(BaseModel):
    subtask_id: str
    task_type: str
    parameters: Dict[str, Any]

class TaskResponse(BaseModel):
    subtask_id: str
    status: str
    result: Dict[str, Any]
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
    """Store analysis data in the research storage service."""
    try:
        research_data = {
            "agent_id": AGENT_ID,
            "task_id": task_id,
            "data_type": data_type,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "agent_type": "analysis",
                "task_type": content.get("task_type", ""),
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
            logger.error(f"Failed to store analysis data: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Error storing analysis data: {e}")
        return False

def _get_research_results(task_id: str) -> Optional[Dict[str, Any]]:
    """Get research results from storage service."""
    try:
        response = requests.get(
            f"{RESEARCH_STORAGE_URL}/api/data",
            params={"data_type": "scraped_data"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                # Get the most recent research data
                latest_data = data["data"][0]
                return latest_data.get("content", {}).get("research_results", {})
        return None
    except Exception as e:
        logger.error(f"Error getting research results: {e}")
        return None

def _search_google_competitors(query: str) -> Dict[str, Any]:
    """Search Google for competitor information."""
    try:
        import requests
        from bs4 import BeautifulSoup
        import urllib.parse
        
        # Use a simple search approach (in production, you'd use Google Search API)
        search_query = urllib.parse.quote(query)
        search_url = f"https://www.google.com/search?q={search_query}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract search results
        competitors = []
        search_results = soup.find_all('div', class_='g')
        
        for result in search_results[:5]:  # Top 5 results
            title_elem = result.find('h3')
            link_elem = result.find('a')
            snippet_elem = result.find('div', class_='VwiC3b')
            
            if title_elem and link_elem:
                competitors.append({
                    "title": title_elem.get_text(),
                    "url": link_elem.get('href', ''),
                    "snippet": snippet_elem.get_text() if snippet_elem else ""
                })
        
        return {
            "search_query": query,
            "competitors_found": len(competitors),
            "competitors": competitors
        }
        
    except Exception as e:
        logger.error(f"Error searching Google: {e}")
        return {"error": str(e)}

def _generate_text_with_ollama(prompt: str) -> str:
    """Generate text using Ollama, with DeepSeek fallback."""
    try:
        # Try Ollama first
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": "llama2:7b",  # Use smaller model
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 200,  # Limit response length
                    "temperature": 0.7
                }
            },
            timeout=500  # Shorter timeout for Ollama
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "")
        else:
            logger.error(f"Ollama API error: {response.status_code}")
            raise Exception("Ollama failed")
            
    except (requests.exceptions.Timeout, Exception) as e:
        logger.warning(f"Ollama failed: {e}, trying DeepSeek API")
        
        # Fallback to DeepSeek API
        try:
            deepseek_response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30
            )
            
            if deepseek_response.status_code == 200:
                result = deepseek_response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                logger.error(f"DeepSeek API error: {deepseek_response.status_code}")
                return "Text generation failed - using fallback analysis"
                
        except Exception as deepseek_error:
            logger.error(f"DeepSeek API also failed: {deepseek_error}")
            return "Text generation failed - using fallback analysis"

def _analyze_bcd_data(bcd_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze Better Call Dominik website data."""
    try:
        # Generate comprehensive analysis using Ollama
        analysis_prompt = f"""
        Analyze the following website data for Better Call Dominik and provide a comprehensive marketing analysis:
        
        Website Data: {json.dumps(bcd_data, indent=2)}
        
        Please provide analysis in the following areas:
        1. Business Model Analysis
        2. Target Audience Analysis
        3. Value Proposition Analysis
        4. Marketing Strategy Analysis
        5. Competitive Positioning
        6. Technical Website Analysis
        7. Recommendations for Improvement
        
        Format the response as a structured analysis with clear sections.
        """
        
        ollama_analysis = _generate_text_with_ollama(analysis_prompt)
        
        # Search for competitors
        competitor_search = _search_google_competitors("exclusive entrepreneur network Germany competitors")
        
        analysis = {
            "business_analysis": {
                "business_model": "Exclusive Network/Community",
                "target_audience": "Entrepreneurs and Investors",
                "value_proposition": [
                    "Network Building",
                    "Deal Flow",
                    "Knowledge Sharing",
                    "Peer Exchange"
                ],
                "revenue_model": "Membership-based"
            },
            "marketing_analysis": {
                "marketing_channels": [
                    "Event Marketing",
                    "Community Marketing",
                    "Exclusivity Marketing"
                ],
                "content_strategy": "High-quality, exclusive content",
                "engagement_tactics": "WhatsApp community, exclusive events"
            },
            "competitive_analysis": {
                "direct_competitors": [
                    "YPO (Young Presidents' Organization)",
                    "EO (Entrepreneurs' Organization)",
                    "Vistage"
                ],
                "competitive_advantages": [
                    "Exclusive network focus",
                    "German market specialization",
                    "High-touch community approach"
                ],
                "google_search_results": competitor_search
            },
            "technical_analysis": {
                "website_quality": "Professional",
                "content_structure": "Well-organized",
                "user_experience": "Good",
                "seo_elements": "Present"
            },
            "ai_generated_analysis": ollama_analysis
        }
        
        # Add specific insights based on scraped data
        if bcd_data.get("website_analysis"):
            website_data = bcd_data["website_analysis"]
            analysis["content_insights"] = {
                "main_topics": website_data.get("content_analysis", {}).get("main_topics", []),
                "content_quality": website_data.get("content_analysis", {}).get("content_quality", "unknown"),
                "marketing_elements": website_data.get("marketing_elements", {})
            }
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing BCD data: {e}")
        return {"error": str(e)}

def _analyze_content(content_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze content structure and messaging."""
    try:
        # Generate content analysis using Ollama
        content_prompt = f"""
        Analyze the following website content and provide marketing insights:
        
        Content Data: {json.dumps(content_data, indent=2)}
        
        Please analyze:
        1. Content Structure and Quality
        2. Key Messaging Themes
        3. Call-to-Action Effectiveness
        4. SEO and Technical Elements
        5. User Experience Factors
        6. Recommendations for Improvement
        
        Provide specific, actionable insights.
        """
        
        ollama_content_analysis = _generate_text_with_ollama(content_prompt)
        
        analysis = {
            "content_structure": {
                "headings_count": len(content_data.get("headings", [])),
                "links_count": len(content_data.get("links", [])),
                "images_count": len(content_data.get("images", [])),
                "text_paragraphs": len(content_data.get("text_content", []))
            },
            "messaging_analysis": {
                "key_themes": [],
                "call_to_actions": [],
                "value_propositions": []
            },
            "seo_analysis": {
                "has_meta_description": bool(content_data.get("description")),
                "has_structured_content": len(content_data.get("headings", [])) > 0,
                "has_images": len(content_data.get("images", [])) > 0
            },
            "ai_content_analysis": ollama_content_analysis
        }
        
        # Analyze headings for themes
        headings = content_data.get("headings", [])
        themes = []
        for heading in headings[:5]:  # Top 5 headings
            text = heading.get("text", "").lower()
            if "netzwerk" in text or "network" in text:
                themes.append("Networking")
            if "exclusive" in text or "exklusiv" in text:
                themes.append("Exclusivity")
            if "deals" in text or "geschäfte" in text:
                themes.append("Deal Flow")
            if "wissen" in text or "knowledge" in text:
                themes.append("Knowledge Sharing")
        
        analysis["messaging_analysis"]["key_themes"] = themes
        
        # Analyze links for CTAs
        links = content_data.get("links", [])
        ctas = []
        for link in links:
            text = link.get("text", "").lower()
            if any(word in text for word in ["contact", "kontakt", "join", "beitreten", "apply", "bewerben"]):
                ctas.append(link.get("text", ""))
        
        analysis["messaging_analysis"]["call_to_actions"] = ctas[:3]  # Top 3 CTAs
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing content: {e}")
        return {"error": str(e)}

def _analyze_market_trends() -> Dict[str, Any]:
    """Analyze market trends and industry insights."""
    try:
        # Generate market analysis using Ollama
        market_prompt = """
        Analyze the current market trends for exclusive entrepreneur networks and provide insights on:
        
        1. Industry Growth Trends
        2. Emerging Market Opportunities
        3. Competitive Landscape Changes
        4. Technology Impact on Networking
        5. Regional Market Differences
        6. Future Market Predictions
        7. Strategic Recommendations
        
        Focus on the German and European markets for exclusive entrepreneur networks.
        """
        
        ollama_market_analysis = _generate_text_with_ollama(market_prompt)
        
        trends = {
            "industry_trends": {
                "networking_platforms": "Growing demand for exclusive networking",
                "digital_communities": "Shift towards digital-first communities",
                "wealth_management": "Increasing focus on alternative investments",
                "entrepreneur_networks": "Rising popularity of peer-to-peer learning"
            },
            "market_opportunities": [
                "Digital transformation of exclusive networks",
                "Integration of AI and automation",
                "Expansion into emerging markets",
                "Development of hybrid event models"
            ],
            "competitive_landscape": {
                "market_leaders": ["YPO", "EO", "Vistage"],
                "emerging_players": ["Mastermind groups", "Online communities"],
                "market_gaps": ["German-speaking exclusive networks", "Tech-focused entrepreneur groups"]
            },
            "ai_market_analysis": ollama_market_analysis
        }
        
        return trends
        
    except Exception as e:
        logger.error(f"Error analyzing market trends: {e}")
        return {"error": str(e)}

@app.post("/task", response_model=TaskResponse)
async def process_task(task_request: TaskRequest):
    """Process an analysis task."""
    try:
        logger.info(f"Processing analysis task: {task_request.subtask_id}")
        
        # Initialize Neo4j connection
        driver = _initialize_neo4j_connection()
        
        # Update agent status in Neo4j
        with driver.session() as session:
            session.run("""
                MERGE (a:Agent {agent_id: $agent_id})
                SET a.status = 'busy', a.current_task = $task_id
            """, agent_id=AGENT_ID, task_id=task_request.subtask_id)
        
        # Get research results if available
        research_results = _get_research_results(task_request.parameters.get("task_id", ""))
        
        # Perform analysis based on task type
        if task_request.task_type == "data_analysis":
            if research_results and "bcd_analysis" in research_results:
                analysis_results = _analyze_bcd_data(research_results["bcd_analysis"])
            else:
                analysis_results = _analyze_content(research_results or {})
        elif task_request.task_type == "pattern_recognition":
            analysis_results = _analyze_market_trends()
        else:
            analysis_results = {"error": f"Unknown task type: {task_request.task_type}"}
        
        # Store analysis data
        _store_research_data(
            task_request.subtask_id,
            "analysis_results",
            {
                "task_type": task_request.task_type,
                "analysis_scope": task_request.parameters.get("analysis_scope", []),
                "analysis_results": analysis_results,
                "research_data_used": bool(research_results)
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
            subtask_id=task_request.subtask_id,
            status="completed",
            result=analysis_results,
            message="Analysis completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error processing analysis task: {e}")
        
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
        
        raise HTTPException(status_code=500, detail=f"Analysis task failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent_id": AGENT_ID}

@app.get("/")
async def root():
    """Root endpoint."""
    return {"agent_id": AGENT_ID, "type": "analysis", "status": "available"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 