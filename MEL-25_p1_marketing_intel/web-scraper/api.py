from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from main import WebScraper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Web Scraper API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ScrapeRequest(BaseModel):
    query: str
    market: str
    limit: int = 5

class ScrapeResponse(BaseModel):
    query: str
    market: str
    results: List[Dict[str, Any]]
    total_results: int

# Initialize web scraper
scraper = None

@app.on_event("startup")
async def startup_event():
    global scraper
    scraper = WebScraper()
    logger.info("Web scraper initialized")

@app.on_event("shutdown")
async def shutdown_event():
    global scraper
    if scraper:
        scraper.cleanup()
        logger.info("Web scraper cleaned up")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Web Scraper API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "scraper": "ready"}

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_competitors(request: ScrapeRequest):
    """Scrape competitors based on query and market"""
    try:
        if not scraper:
            raise HTTPException(status_code=500, detail="Web scraper not initialized")
        
        logger.info(f"Scraping for query: {request.query} in market: {request.market}")
        
        # Get search results from Google
        google_results = scraper.search_google(request.query, request.market)
        
        # Get LinkedIn results
        linkedin_results = scraper.scrape_linkedin_companies(request.query, request.market)
        
        # Get business directory results
        directory_results = scraper.scrape_business_directories(request.query, request.market)
        
        # Combine all results
        all_results = google_results + linkedin_results + directory_results
        
        # Limit results
        limited_results = all_results[:request.limit]
        
        # Save scraped data to database
        if limited_results:
            scraper.save_scraped_data(limited_results)
        
        return ScrapeResponse(
            query=request.query,
            market=request.market,
            results=limited_results,
            total_results=len(limited_results)
        )
        
    except Exception as e:
        logger.error(f"Error scraping competitors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_scraping_status():
    """Get scraping status"""
    try:
        if not scraper:
            return {"status": "error", "message": "Web scraper not initialized"}
        
        status = scraper.get_scraping_status()
        return status
        
    except Exception as e:
        logger.error(f"Error getting scraping status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 