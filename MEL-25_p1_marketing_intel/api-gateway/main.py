from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import psycopg2
import json
import os
import logging
from datetime import datetime
import requests
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Marketing Intelligence API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class CompetitorResponse(BaseModel):
    id: int
    company_name: str
    industry: Optional[str]
    business_model: Optional[str]
    target_audience: Optional[str]
    key_strengths: List[str]
    competitive_advantages: List[str]
    market_position: Optional[str]
    threat_level: str
    market: str
    created_at: Optional[str]

class ResearchStatus(BaseModel):
    total_competitors: int
    german_competitors: int
    international_competitors: int
    status: str

class ResearchRequest(BaseModel):
    target_company: str = "bettercalldominik"
    markets: List[str] = ["German", "International"]

# Database connection
def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    return psycopg2.connect(database_url)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Marketing Intelligence API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/competitors", response_model=List[CompetitorResponse])
async def get_competitors(market: Optional[str] = None, limit: int = 50):
    """Get all competitors with optional filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if market:
            cursor.execute("""
                SELECT id, company_name, industry, business_model, target_audience,
                       key_strengths, competitive_advantages, market_position,
                       threat_level, market, created_at
                FROM competitors 
                WHERE market = %s 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (market, limit))
        else:
            cursor.execute("""
                SELECT id, company_name, industry, business_model, target_audience,
                       key_strengths, competitive_advantages, market_position,
                       threat_level, market, created_at
                FROM competitors 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
        
        competitors = []
        for row in cursor.fetchall():
            # Handle JSON fields that might already be lists
            key_strengths = row[5] if isinstance(row[5], list) else (json.loads(row[5]) if row[5] else [])
            competitive_advantages = row[6] if isinstance(row[6], list) else (json.loads(row[6]) if row[6] else [])
            
            competitor = {
                "id": row[0],
                "company_name": row[1],
                "industry": row[2],
                "business_model": row[3],
                "target_audience": row[4],
                "key_strengths": key_strengths,
                "competitive_advantages": competitive_advantages,
                "market_position": row[7],
                "threat_level": row[8],
                "market": row[9],
                "created_at": row[10].isoformat() if row[10] else None
            }
            competitors.append(competitor)
        
        cursor.close()
        conn.close()
        
        return competitors
        
    except Exception as e:
        logger.error(f"Error getting competitors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/competitors/{competitor_id}", response_model=CompetitorResponse)
async def get_competitor(competitor_id: int):
    """Get a specific competitor by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, company_name, industry, business_model, target_audience,
                   key_strengths, competitive_advantages, market_position,
                   threat_level, market, created_at
            FROM competitors 
            WHERE id = %s
        """, (competitor_id,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Competitor not found")
        
        # Handle JSON fields that might already be lists
        key_strengths = row[5] if isinstance(row[5], list) else (json.loads(row[5]) if row[5] else [])
        competitive_advantages = row[6] if isinstance(row[6], list) else (json.loads(row[6]) if row[6] else [])
        
        competitor = {
            "id": row[0],
            "company_name": row[1],
            "industry": row[2],
            "business_model": row[3],
            "target_audience": row[4],
            "key_strengths": key_strengths,
            "competitive_advantages": competitive_advantages,
            "market_position": row[7],
            "threat_level": row[8],
            "market": row[9],
            "created_at": row[10].isoformat() if row[10] else None
        }
        
        cursor.close()
        conn.close()
        
        return competitor
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting competitor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status", response_model=ResearchStatus)
async def get_research_status():
    """Get current research status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM competitors")
        total_competitors = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM competitors WHERE market = 'German'")
        german_competitors = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM competitors WHERE market = 'International'")
        international_competitors = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            "total_competitors": total_competitors,
            "german_competitors": german_competitors,
            "international_competitors": international_competitors,
            "status": "active"
        }
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/research/start")
async def start_research(background_tasks: BackgroundTasks):
    """Start competitor research in background"""
    try:
        # This would trigger the AI agent to start research
        # For now, we'll simulate the process
        background_tasks.add_task(simulate_research)
        
        return {
            "message": "Research started successfully",
            "status": "running",
            "target_company": "bettercalldominik"
        }
        
    except Exception as e:
        logger.error(f"Error starting research: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def simulate_research():
    """Simulate research process"""
    logger.info("Starting simulated research process...")
    # In a real implementation, this would trigger the AI agent
    # For now, we'll just log the process
    await asyncio.sleep(5)
    logger.info("Research simulation completed")

@app.get("/research/sessions")
async def get_research_sessions():
    """Get all research sessions"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, session_name, target_company, status, started_at, 
                   completed_at, total_competitors_found, german_competitors_found, 
                   international_competitors_found
            FROM research_sessions 
            ORDER BY started_at DESC
        """)
        
        sessions = []
        for row in cursor.fetchall():
            session = {
                "id": row[0],
                "session_name": row[1],
                "target_company": row[2],
                "status": row[3],
                "started_at": row[4],
                "completed_at": row[5],
                "total_competitors_found": row[6],
                "german_competitors_found": row[7],
                "international_competitors_found": row[8]
            }
            sessions.append(session)
        
        cursor.close()
        conn.close()
        
        return sessions
        
    except Exception as e:
        logger.error(f"Error getting research sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/threat-levels")
async def get_threat_level_analytics():
    """Get analytics on threat levels"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT threat_level, COUNT(*) as count
            FROM competitors 
            GROUP BY threat_level
            ORDER BY count DESC
        """)
        
        analytics = []
        for row in cursor.fetchall():
            analytics.append({
                "threat_level": row[0],
                "count": row[1]
            })
        
        cursor.close()
        conn.close()
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting threat level analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/markets")
async def get_market_analytics():
    """Get analytics on markets"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT market, COUNT(*) as count
            FROM competitors 
            GROUP BY market
            ORDER BY count DESC
        """)
        
        analytics = []
        for row in cursor.fetchall():
            analytics.append({
                "market": row[0],
                "count": row[1]
            })
        
        cursor.close()
        conn.close()
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting market analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 