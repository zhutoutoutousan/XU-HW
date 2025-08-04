import os
import time
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import requests
import psycopg2
import redis
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from fake_useragent import UserAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebScraper:
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL')
        self.redis_url = os.getenv('REDIS_URL')
        self.target_company = "bettercalldominik"
        
        # Initialize connections
        self.redis_client = redis.from_url(self.redis_url)
        self.db_conn = None
        self.connect_database()
        
        # Initialize web driver
        self.driver = None
        self.setup_driver()
        
    def connect_database(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(self.database_url)
            logger.info("Connected to database successfully")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
    
    def setup_driver(self):
        """Setup Chrome web driver with options"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument(f"--user-agent={UserAgent().random}")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.info("Web driver setup successfully")
        except Exception as e:
            logger.error(f"Web driver setup failed: {e}")
    
    def search_google(self, query: str, market: str) -> List[Dict[str, Any]]:
        """Search Google for competitors"""
        results = []
        try:
            # Add market-specific terms to query
            if market.lower() == "german":
                query += " Deutschland"
            elif market.lower() == "international":
                query += " global competitors"
            
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            
            self.driver.get(search_url)
            time.sleep(2)
            
            # Wait for search results
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.g"))
            )
            
            # Extract search results
            search_results = self.driver.find_elements(By.CSS_SELECTOR, "div.g")
            
            for result in search_results[:5]:  # Limit to 5 results
                try:
                    title_element = result.find_element(By.CSS_SELECTOR, "h3")
                    link_element = result.find_element(By.CSS_SELECTOR, "a")
                    snippet_element = result.find_element(By.CSS_SELECTOR, "div.VwiC3b")
                    
                    title = title_element.text
                    link = link_element.get_attribute("href")
                    snippet = snippet_element.text
                    
                    results.append({
                        "title": title,
                        "link": link,
                        "snippet": snippet,
                        "source": "Google",
                        "query": query,
                        "market": market
                    })
                    
                except Exception as e:
                    logger.warning(f"Error extracting search result: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error searching Google: {e}")
            
        return results
    
    def scrape_linkedin_companies(self, query: str, market: str) -> List[Dict[str, Any]]:
        """Scrape LinkedIn for company information"""
        results = []
        try:
            # Note: LinkedIn scraping requires authentication and may be blocked
            # This is a simplified version
            search_url = f"https://www.linkedin.com/search/results/companies/?keywords={query.replace(' ', '%20')}"
            
            self.driver.get(search_url)
            time.sleep(3)
            
            # Extract company information (simplified)
            company_elements = self.driver.find_elements(By.CSS_SELECTOR, ".entity-result__item")
            
            for element in company_elements[:3]:  # Limit to 3 results
                try:
                    name_element = element.find_element(By.CSS_SELECTOR, ".entity-result__title-text")
                    name = name_element.text
                    
                    results.append({
                        "title": name,
                        "link": "",
                        "snippet": f"LinkedIn company profile for {name}",
                        "source": "LinkedIn",
                        "query": query,
                        "market": market
                    })
                    
                except Exception as e:
                    logger.warning(f"Error extracting LinkedIn result: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {e}")
            
        return results
    
    def scrape_business_directories(self, query: str, market: str) -> List[Dict[str, Any]]:
        """Scrape business directories for competitor information"""
        results = []
        
        # German business directories
        if market.lower() == "german":
            directories = [
                "https://www.gelbe-seiten.de",
                "https://www.dasoertliche.de",
                "https://www.branchenbuch24.de"
            ]
        else:
            # International directories
            directories = [
                "https://www.yellowpages.com",
                "https://www.yelp.com",
                "https://www.zoominfo.com"
            ]
        
        for directory in directories:
            try:
                # Simplified scraping - in real implementation, you'd need specific selectors
                results.append({
                    "title": f"Competitor from {directory}",
                    "link": directory,
                    "snippet": f"Found competitor information for query: {query}",
                    "source": directory,
                    "query": query,
                    "market": market
                })
                
            except Exception as e:
                logger.error(f"Error scraping directory {directory}: {e}")
                
        return results
    
    def save_scraped_data(self, scraped_data: List[Dict[str, Any]]):
        """Save scraped data to database"""
        try:
            cursor = self.db_conn.cursor()
            
            for data in scraped_data:
                cursor.execute("""
                    INSERT INTO scraped_data (
                        title, link, snippet, source, query, market, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    data.get('title', ''),
                    data.get('link', ''),
                    data.get('snippet', ''),
                    data.get('source', ''),
                    data.get('query', ''),
                    data.get('market', ''),
                    datetime.now()
                ))
            
            self.db_conn.commit()
            logger.info(f"Saved {len(scraped_data)} scraped data entries")
            
        except Exception as e:
            logger.error(f"Error saving scraped data: {e}")
            self.db_conn.rollback()
    
    def scrape_competitors(self, queries: List[str], market: str):
        """Scrape competitors for given queries and market"""
        logger.info(f"Starting competitor scraping for {market} market")
        
        all_results = []
        
        for query in queries:
            logger.info(f"Processing query: {query}")
            
            # Search Google
            google_results = self.search_google(query, market)
            all_results.extend(google_results)
            
            # Scrape LinkedIn (limited due to restrictions)
            linkedin_results = self.scrape_linkedin_companies(query, market)
            all_results.extend(linkedin_results)
            
            # Scrape business directories
            directory_results = self.scrape_business_directories(query, market)
            all_results.extend(directory_results)
            
            # Add delay between queries
            time.sleep(3)
        
        # Save all scraped data
        if all_results:
            self.save_scraped_data(all_results)
            logger.info(f"Completed scraping for {market} market. Found {len(all_results)} results.")
        else:
            logger.warning(f"No results found for {market} market")
    
    def get_scraping_status(self) -> Dict[str, Any]:
        """Get current scraping status"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM scraped_data")
            total_scraped = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM scraped_data WHERE market = 'German'")
            german_scraped = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM scraped_data WHERE market = 'International'")
            international_scraped = cursor.fetchone()[0]
            
            return {
                "total_scraped": total_scraped,
                "german_scraped": german_scraped,
                "international_scraped": international_scraped,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"Error getting scraping status: {e}")
            return {"status": "error", "message": str(e)}
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()
        if self.db_conn:
            self.db_conn.close()

def main():
    """Main function to run the web scraper"""
    scraper = WebScraper()
    
    try:
        # Sample queries for testing
        german_queries = [
            "bettercalldominik competitors Germany",
            "German marketing agencies",
            "Digital marketing companies Germany"
        ]
        
        international_queries = [
            "bettercalldominik competitors global",
            "International marketing agencies",
            "Digital marketing companies worldwide"
        ]
        
        # Scrape German market
        scraper.scrape_competitors(german_queries, "German")
        
        # Scrape international market
        scraper.scrape_competitors(international_queries, "International")
        
        # Get and log status
        status = scraper.get_scraping_status()
        logger.info(f"Scraping status: {status}")
        
    except Exception as e:
        logger.error(f"Error in main scraping process: {e}")
    finally:
        scraper.cleanup()

if __name__ == "__main__":
    main() 