# MEL-25 Marketing Intelligence AI Agent Architecture

## System Overview
This system is designed to automatically discover and analyze competitors of "bettercalldominik" from both German and international markets using AI agents.

## Architecture Components

### 1. AI Agent Container
- **Purpose**: Primary AI agent that orchestrates competitor research
- **Technology**: Python with DeepSeek API integration
- **Responsibilities**:
  - Query formulation for competitor research
  - Web scraping coordination
  - Data processing and analysis
  - Result aggregation and storage

### 2. Web Scraper Container
- **Purpose**: Extracts competitor information from various sources
- **Technology**: Python with Selenium/BeautifulSoup
- **Responsibilities**:
  - Search engine queries
  - Social media platform scraping
  - Business directory extraction
  - Data validation and cleaning

### 3. Database Container
- **Purpose**: Stores competitor data and research results
- **Technology**: PostgreSQL
- **Schema**: Competitors, research sessions, analysis results

### 4. API Gateway Container
- **Purpose**: REST API for system interaction
- **Technology**: FastAPI
- **Responsibilities**:
  - Agent control endpoints
  - Result retrieval
  - Status monitoring

## Data Flow
1. User triggers competitor research via API
2. AI Agent formulates research strategy
3. Web Scraper executes searches and data extraction
4. AI Agent processes and analyzes results
5. Results stored in database
6. API returns findings to user

## Market Focus
- **German Market**: Local competitors, German business directories
- **International Market**: Global competitors, international platforms

## Technology Stack
- **AI**: DeepSeek API for intelligent analysis
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **API**: FastAPI
- **Web Scraping**: Selenium, BeautifulSoup
- **Monitoring**: Logging and status endpoints
