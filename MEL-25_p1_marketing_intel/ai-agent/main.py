import os
import asyncio
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any
import requests
import psycopg2
import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketingIntelligenceAgent:
    def __init__(self):
        self.deepseek_api_key = os.getenv('DEEPSEEK_API_KEY')
        self.database_url = os.getenv('DATABASE_URL')
        self.redis_url = os.getenv('REDIS_URL')
        self.target_company = "bettercalldominik"
        
        # Initialize connections
        self.redis_client = redis.from_url(self.redis_url)
        self.db_conn = None
        self.connect_database()
        
    def connect_database(self):
        """Connect to PostgreSQL database with retry logic"""
        max_retries = 10
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.db_conn = psycopg2.connect(self.database_url)
                logger.info("Connected to database successfully")
                return
            except Exception as e:
                logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 1.5  # Exponential backoff
                else:
                    logger.error(f"Failed to connect to database after {max_retries} attempts")
                    self.db_conn = None
            
    def call_deepseek_api(self, prompt: str) -> str:
        """Call DeepSeek API for AI analysis"""
        try:
            headers = {
                "Authorization": f"Bearer {self.deepseek_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,  # Lower temperature for more consistent output
                "max_tokens": 1500,  # Reduced for faster response
                "top_p": 0.9
            }
            
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=120  # Reduced timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                logger.info(f"DeepSeek API response received: {len(content)} characters")
                return content
            else:
                logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error("DeepSeek API request timed out")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"DeepSeek API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Error calling DeepSeek API: {e}")
            return None
    
    def get_real_competitor_data(self, query: str, market: str) -> str:
        """Get real competitor data from web scraper"""
        try:
            # Call web scraper service to get real data
            scraper_url = "http://web-scraper:5000/scrape"
            
            data = {
                "query": query,
                "market": market,
                "limit": 3  # Get top 3 results
            }
            
            response = requests.post(scraper_url, json=data, timeout=30)
            
            if response.status_code == 200:
                scraped_data = response.json()
                
                # Combine all scraped data into a single string for analysis
                combined_data = ""
                for item in scraped_data.get('results', []):
                    combined_data += f"Title: {item.get('title', '')}\n"
                    combined_data += f"Link: {item.get('link', '')}\n"
                    combined_data += f"Description: {item.get('snippet', '')}\n"
                    combined_data += f"Source: {item.get('source', '')}\n\n"
                
                logger.info(f"Retrieved {len(scraped_data.get('results', []))} results for query: {query}")
                return combined_data
            else:
                logger.error(f"Web scraper error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting real competitor data: {e}")
            return None
    
    def create_basic_competitor_data(self, scraped_data: str, market: str) -> Dict[str, Any]:
        """Create basic competitor data from scraped results when AI analysis fails"""
        try:
            # Extract company names from scraped data
            lines = scraped_data.split('\n')
            company_name = "Unknown"
            industry = "Business Networking"
            business_model = "Membership-based networking platform"
            target_audience = "Entrepreneurs, investors, and family offices"
            
            # Look for company names in titles and descriptions
            for line in lines:
                if line.startswith('Title:') and 'bettercalldominik' not in line.lower():
                    title = line.replace('Title:', '').strip()
                    
                    # Skip if title contains bettercalldominik or is too generic
                    if 'bettercalldominik' in title.lower() or any(generic in title.lower() for generic in ['competitor', 'competition', 'compare', 'vs', 'versus']):
                        continue
                    
                    # Extract potential company name from title
                    words = title.split()
                    if len(words) > 0:
                        # Look for capitalized words that might be company names
                        potential_name_parts = []
                        for word in words[:8]:  # Check first 8 words
                            if word and word[0].isupper() and len(word) > 2 and word.lower() not in ['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an']:
                                potential_name_parts.append(word)
                        
                        if potential_name_parts:
                            potential_name = ' '.join(potential_name_parts[:4])  # Take first 4 capitalized words
                            if len(potential_name) > 3 and potential_name.lower() != 'bettercalldominik':
                                company_name = potential_name
                                break
                
                # Also check descriptions for company names
                elif line.startswith('Description:') and 'bettercalldominik' not in line.lower():
                    description = line.replace('Description:', '').strip()
                    # Look for company names in description
                    if not company_name or company_name == "Unknown":
                        words = description.split()
                        potential_name_parts = []
                        for word in words[:10]:  # Check first 10 words
                            if word and word[0].isupper() and len(word) > 2 and word.lower() not in ['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an']:
                                potential_name_parts.append(word)
                        
                        if potential_name_parts:
                            potential_name = ' '.join(potential_name_parts[:4])
                            if len(potential_name) > 3 and potential_name.lower() != 'bettercalldominik':
                                company_name = potential_name
            
            # If we still have a generic or unknown company name, try follow-up search
            if company_name in ["Unknown", "Found", "Competitor"] or len(company_name) < 4:
                logger.info(f"Initial extraction failed, attempting follow-up search for better company name")
                
                # Generate follow-up search queries
                followup_queries = self.generate_followup_search_queries(scraped_data, market)
                
                # Try each follow-up query to find a better company name
                for query in followup_queries:
                    logger.info(f"Trying follow-up query: {query}")
                    followup_data = self.get_real_competitor_data(query, market)
                    
                    if followup_data:
                        # Try to extract company name from follow-up data
                        followup_lines = followup_data.split('\n')
                        for line in followup_lines:
                            if line.startswith('Title:') and 'bettercalldominik' not in line.lower():
                                title = line.replace('Title:', '').strip()
                                
                                # Skip generic titles
                                if any(generic in title.lower() for generic in ['competitor', 'competition', 'compare', 'vs', 'versus', 'found', 'search']):
                                    continue
                                
                                # Extract potential company name
                                words = title.split()
                                if len(words) > 0:
                                    potential_name_parts = []
                                    for word in words[:6]:
                                        if word and word[0].isupper() and len(word) > 2 and word.lower() not in ['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an']:
                                            potential_name_parts.append(word)
                                    
                                    if potential_name_parts:
                                        potential_name = ' '.join(potential_name_parts[:3])
                                        if len(potential_name) > 3 and potential_name.lower() != 'bettercalldominik':
                                            company_name = potential_name
                                            logger.info(f"Found better company name from follow-up search: {company_name}")
                                            break
                        
                        if company_name not in ["Unknown", "Found", "Competitor"] and len(company_name) >= 4:
                            break  # Found a good company name, stop searching
            
            # Determine industry and business model based on keywords
            all_text = scraped_data.lower()
            
            # Check for specific industry keywords
            if any(keyword in all_text for keyword in ['network', 'community', 'club', 'group', 'association']):
                industry = "Business Networking"
                business_model = "Membership-based networking platform"
            elif any(keyword in all_text for keyword in ['retreat', 'event', 'conference', 'summit']):
                industry = "Business Events & Retreats"
                business_model = "Event organization and retreat hosting"
            elif any(keyword in all_text for keyword in ['investment', 'deal', 'capital', 'venture']):
                industry = "Investment & Deal Flow"
                business_model = "Investment network and deal sharing platform"
            elif any(keyword in all_text for keyword in ['learning', 'education', 'training', 'mentorship']):
                industry = "Business Education"
                business_model = "Peer-to-peer learning platform"
            
            # Determine target audience
            if any(keyword in all_text for keyword in ['entrepreneur', 'founder', 'startup']):
                target_audience = "Entrepreneurs and startup founders"
            elif any(keyword in all_text for keyword in ['investor', 'angel', 'vc', 'venture']):
                target_audience = "Investors and venture capitalists"
            elif any(keyword in all_text for keyword in ['family office', 'wealth', 'high-net-worth']):
                target_audience = "Family offices and high-net-worth individuals"
            else:
                target_audience = "Entrepreneurs, investors, and family offices"
            
            # Create basic analysis
            return {
                "company_name": company_name,
                "industry": industry,
                "business_model": business_model,
                "target_audience": target_audience,
                "key_strengths": ["Networking", "Exclusive community"],
                "competitive_advantages": ["High-end membership"],
                "market_position": f"Competitor in {market} market",
                "threat_level": "Medium",
                "raw_analysis": scraped_data[:500]  # First 500 chars
            }
            
        except Exception as e:
            logger.error(f"Error creating basic competitor data: {e}")
            return None
    
    def generate_research_queries(self, market: str) -> List[str]:
        """Generate research queries for competitor analysis"""
        prompt = f"""
        Generate 5 specific search queries to find competitors of "{self.target_company}" in the {market} market.
        
        IMPORTANT: {self.target_company} is a business networking and retreat platform for entrepreneurs, investors, and family offices. It's similar to YPO (Young Presidents' Organization) and offers:
        - Exclusive networking communities for high-net-worth individuals
        - Business retreats and events
        - Peer-to-peer learning and knowledge sharing
        - Deal flow and investment opportunities
        - Private networking groups and forums
        
        Focus on finding:
        1. Other exclusive business networking platforms and communities
        2. High-end business retreat and event organizers
        3. Peer-to-peer learning platforms for entrepreneurs
        4. Investment and deal flow networks
        5. Private business communities and membership organizations
        
        Return only the search queries, one per line, without numbering or explanations.
        Make sure queries are about BUSINESS NETWORKING and RETREAT PLATFORMS, not legal services.
        """
        
        response = self.call_deepseek_api(prompt)
        if response:
            queries = [q.strip() for q in response.split('\n') if q.strip()]
            return queries[:5]  # Limit to 5 queries
        
        # Fallback queries if AI fails
        if market.lower() == "german":
            return [
                "business networking platform Germany",
                "entrepreneur retreat Germany", 
                "investor community Germany",
                "family office network Germany",
                "business networking events Germany"
            ]
        else:
            return [
                "business networking platform global",
                "entrepreneur retreat international",
                "investor community worldwide",
                "family office network international",
                "business networking events global"
            ]
    
    def generate_followup_search_queries(self, scraped_data: str, market: str) -> List[str]:
        """Generate follow-up search queries when initial company name extraction fails"""
        prompt = f"""
        Based on this scraped data from the {market} market, generate 3 specific search queries to find actual competitor companies:
        
        {scraped_data[:1000]}  # First 1000 chars to avoid token limits
        
        The target company is "bettercalldominik" - a business networking and retreat platform.
        
        Generate search queries that will find:
        1. Specific company names mentioned in the data
        2. Business networking platforms and communities
        3. Retreat and event organizers
        
        Return only the search queries, one per line, without numbering.
        Make queries specific enough to find actual company names, not generic terms.
        """
        
        response = self.call_deepseek_api(prompt)
        if response:
            queries = [q.strip() for q in response.split('\n') if q.strip()]
            return queries[:3]  # Limit to 3 follow-up queries
        
        # Fallback specific queries
        if market.lower() == "german":
            return [
                "YPO Germany business networking",
                "Entrepreneurs Organization Germany",
                "German business retreat platforms"
            ]
        else:
            return [
                "YPO international business networking",
                "Entrepreneurs Organization global",
                "International business retreat platforms"
            ]
    
    def analyze_competitor_data(self, raw_data: str, market: str) -> Dict[str, Any]:
        """Analyze competitor data using DeepSeek API"""
        prompt = f"""
        Analyze the following competitor data for "{self.target_company}" in the {market} market:
        
        {raw_data}
        
        Extract and structure the following information into a VALID JSON object:
        - company_name: The name of the competitor company (NOT {self.target_company})
        - industry: The industry or sector they operate in
        - business_model: Their business model description
        - target_audience: Who they target as customers
        - key_strengths: Array of their key strengths
        - competitive_advantages: Array of their competitive advantages
        - market_position: Their position in the market
        - threat_level: "Low", "Medium", or "High"
        
        CRITICAL: The company_name must be a DIFFERENT company than "{self.target_company}". 
        If you cannot identify a specific company name from the data, return null for company_name.
        
        IMPORTANT: Return ONLY a valid JSON object with this exact structure:
        {{
            "company_name": "Actual Company Name",
            "industry": "Industry Name",
            "business_model": "Business Model Description",
            "target_audience": "Target Audience Description",
            "key_strengths": ["Strength 1", "Strength 2"],
            "competitive_advantages": ["Advantage 1", "Advantage 2"],
            "market_position": "Market Position Description",
            "threat_level": "Medium"
        }}
        
        Do not include any text before or after the JSON object. Return ONLY the JSON.
        """
        
        response = self.call_deepseek_api(prompt)
        if response:
            try:
                # Clean the response - remove any markdown formatting
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                cleaned_response = cleaned_response.strip()
                
                # Try to extract JSON from response
                start_idx = cleaned_response.find('{')
                end_idx = cleaned_response.rfind('}') + 1
                
                if start_idx != -1 and end_idx != -1:
                    json_str = cleaned_response[start_idx:end_idx]
                    logger.info(f"Attempting to parse JSON: {json_str[:200]}...")
                    
                    parsed_data = json.loads(json_str)
                    
                    # Validate that we have the required fields
                    required_fields = ['company_name', 'industry', 'business_model', 'target_audience']
                    missing_fields = [field for field in required_fields if field not in parsed_data or not parsed_data[field]]
                    
                    if not missing_fields:
                        logger.info(f"Successfully parsed DeepSeek response for company: {parsed_data.get('company_name', 'Unknown')}")
                        return parsed_data
                    else:
                        logger.warning(f"DeepSeek response missing required fields: {missing_fields}")
                        logger.warning(f"Received data: {parsed_data}")
                        
                else:
                    logger.warning("No JSON object found in DeepSeek response")
                    logger.warning(f"Response content: {response[:500]}...")
                        
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON from DeepSeek response: {e}")
                logger.warning(f"Response content: {response[:500]}...")
            except Exception as e:
                logger.warning(f"Error processing DeepSeek response: {e}")
        
        # If DeepSeek analysis fails, return None to trigger fallback
        logger.info("DeepSeek analysis failed, will use fallback extraction")
        return None
    
    def save_competitor_data(self, competitor_data: Dict[str, Any], market: str):
        """Save competitor data to database"""
        if self.db_conn is None:
            logger.error("Cannot save competitor data: database connection is None")
            return
            
        try:
            cursor = self.db_conn.cursor()
            
            cursor.execute("""
                INSERT INTO competitors (
                    company_name, industry, business_model, target_audience,
                    key_strengths, competitive_advantages, market_position,
                    threat_level, market, raw_analysis, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                competitor_data.get('company_name', 'Unknown'),
                competitor_data.get('industry', 'Unknown'),
                competitor_data.get('business_model', 'Unknown'),
                competitor_data.get('target_audience', 'Unknown'),
                json.dumps(competitor_data.get('key_strengths', [])),
                json.dumps(competitor_data.get('competitive_advantages', [])),
                competitor_data.get('market_position', 'Unknown'),
                competitor_data.get('threat_level', 'Medium'),
                market,
                json.dumps(competitor_data.get('raw_analysis', '')),
                datetime.now()
            ))
            
            self.db_conn.commit()
            logger.info(f"Saved competitor data for {competitor_data.get('company_name', 'Unknown')}")
            
        except Exception as e:
            logger.error(f"Error saving competitor data: {e}")
            if self.db_conn:
                self.db_conn.rollback()
    
    def research_german_market(self):
        """Research German market competitors"""
        logger.info("Starting German market research...")
        
        queries = self.generate_research_queries("German")
        logger.info(f"Generated {len(queries)} queries for German market")
        
        for i, query in enumerate(queries, 1):
            logger.info(f"Processing query {i}/{len(queries)}: {query}")
            
            # Get real competitor data from web scraper
            competitor_data = self.get_real_competitor_data(query, "German")
            
            if competitor_data:
                # Analyze the real data
                analysis = self.analyze_competitor_data(competitor_data, "German")
                
                if analysis and analysis.get('company_name') and analysis.get('company_name') != 'Unknown' and analysis.get('company_name').lower() != self.target_company.lower():
                    self.save_competitor_data(analysis, "German")
                else:
                    # Fallback: create basic competitor data from scraped results
                    basic_analysis = self.create_basic_competitor_data(competitor_data, "German")
                    if basic_analysis and basic_analysis.get('company_name') != 'Unknown' and basic_analysis.get('company_name').lower() != self.target_company.lower():
                        self.save_competitor_data(basic_analysis, "German")
                    else:
                        logger.warning(f"No valid competitor data extracted for query: {query}")
                
            # Add delay between queries
            time.sleep(2)
    
    def research_international_market(self):
        """Research international market competitors"""
        logger.info("Starting international market research...")
        
        queries = self.generate_research_queries("international")
        logger.info(f"Generated {len(queries)} queries for international market")
        
        for i, query in enumerate(queries, 1):
            logger.info(f"Processing query {i}/{len(queries)}: {query}")
            
            # Get real competitor data from web scraper
            competitor_data = self.get_real_competitor_data(query, "International")
            
            if competitor_data:
                # Analyze the real data
                analysis = self.analyze_competitor_data(competitor_data, "International")
                
                if analysis and analysis.get('company_name') and analysis.get('company_name') != 'Unknown' and analysis.get('company_name').lower() != self.target_company.lower():
                    self.save_competitor_data(analysis, "International")
                else:
                    # Fallback: create basic competitor data from scraped results
                    basic_analysis = self.create_basic_competitor_data(competitor_data, "International")
                    if basic_analysis and basic_analysis.get('company_name') != 'Unknown' and basic_analysis.get('company_name').lower() != self.target_company.lower():
                        self.save_competitor_data(basic_analysis, "International")
                    else:
                        logger.warning(f"No valid competitor data extracted for query: {query}")
                
            # Add delay between queries
            time.sleep(2)
    
    def run_full_research(self):
        """Run complete competitor research"""
        logger.info("Starting full competitor research for bettercalldominik")
        
        try:
            # Research German market
            self.research_german_market()
            
            # Research international market
            self.research_international_market()
            
            logger.info("Competitor research completed successfully")
            
        except Exception as e:
            logger.error(f"Error during research: {e}")
    
    def get_research_status(self) -> Dict[str, Any]:
        """Get current research status"""
        if self.db_conn is None:
            logger.error("Cannot get research status: database connection is None")
            return {"status": "error", "message": "Database connection is None"}
            
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM competitors")
            total_competitors = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM competitors WHERE market = 'German'")
            german_competitors = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM competitors WHERE market = 'International'")
            international_competitors = cursor.fetchone()[0]
            
            return {
                "total_competitors": total_competitors,
                "german_competitors": german_competitors,
                "international_competitors": international_competitors,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {"status": "error", "message": str(e)}

def main():
    """Main function to run the AI agent"""
    agent = MarketingIntelligenceAgent()
    
    # Run the research
    agent.run_full_research()
    
    # Get and log status
    status = agent.get_research_status()
    logger.info(f"Research status: {status}")

if __name__ == "__main__":
    main() 