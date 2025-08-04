# Marketing Intelligence AI Agent System

A Docker container-based AI agent system that automatically discovers and analyzes competitors of "bettercalldominik" from both German and international markets using DeepSeek API.

## 🚀 Features

- **AI-Powered Research**: Uses DeepSeek API for intelligent competitor analysis
- **Multi-Market Coverage**: Researches both German and international markets
- **Web Scraping**: Automated data collection from various sources
- **Database Storage**: PostgreSQL for structured data storage
- **REST API**: FastAPI-based API for system interaction
- **Containerized**: Fully Docker-based deployment

## 🏗️ Architecture

### Components

1. **AI Agent Container** (`ai-agent/`)
   - Orchestrates competitor research
   - Generates intelligent search queries
   - Analyzes competitor data using DeepSeek API
   - Stores results in database

2. **Web Scraper Container** (`web-scraper/`)
   - Extracts competitor information from web sources
   - Searches Google, LinkedIn, and business directories
   - Handles market-specific data collection

3. **API Gateway Container** (`api-gateway/`)
   - REST API for system interaction
   - Provides endpoints for data retrieval
   - Status monitoring and analytics

4. **Database Container** (`database/`)
   - PostgreSQL database for data storage
   - Stores competitors, research sessions, and scraped data

5. **Redis Container**
   - Caching and session management
   - Inter-service communication

## 🛠️ Setup Instructions

### Prerequisites

- Docker Desktop installed and running
- DeepSeek API key (get from [DeepSeek](https://platform.deepseek.com/))

### Quick Start

1. **Clone and Navigate**
   ```bash
   cd MEL-25_p1_marketing_intel
   ```

2. **Setup Environment**
   ```bash
   # Copy environment template
   copy env.example .env
   
   # Edit .env file and add your DeepSeek API key
   notepad .env
   ```

3. **Start the System**
   ```bash
   # Run the startup script
   .\start.ps1
   ```

   Or manually:
   ```bash
   docker-compose up --build -d
   ```

4. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Competitors: http://localhost:8000/competitors

## 📊 API Endpoints

### Core Endpoints

- `GET /` - System status
- `GET /health` - Health check
- `GET /competitors` - List all competitors
- `GET /competitors/{id}` - Get specific competitor
- `GET /status` - Research status
- `POST /research/start` - Start research process

### Analytics Endpoints

- `GET /analytics/threat-levels` - Threat level distribution
- `GET /analytics/markets` - Market distribution
- `GET /research/sessions` - Research session history

## 🔍 How It Works

### 1. Research Process

1. **Query Generation**: AI agent generates intelligent search queries for competitor research
2. **Web Scraping**: Scraper collects data from various sources (Google, LinkedIn, directories)
3. **Data Analysis**: AI analyzes collected data using DeepSeek API
4. **Storage**: Results stored in PostgreSQL database
5. **API Access**: Results available via REST API

### 2. Market Coverage

**German Market:**
- German business directories (Gelbe Seiten, Das Örtliche)
- German-specific search queries
- Local competitor analysis

**International Market:**
- Global business directories
- International search queries
- Worldwide competitor analysis

### 3. Data Structure

Each competitor record includes:
- Company name and industry
- Business model and target audience
- Key strengths and competitive advantages
- Market position and threat level
- Source and analysis metadata

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8000 | FastAPI REST API |
| database | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |
| ai-agent | - | AI research agent |
| web-scraper | - | Web scraping service |

## 📁 Project Structure

```
MEL-25_p1_marketing_intel/
├── ai-agent/                 # AI agent container
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── web-scraper/             # Web scraper container
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── api-gateway/             # API gateway container
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── database/                # Database initialization
│   └── init.sql
├── docker-compose.yml       # Docker orchestration
├── architecture.md          # System architecture
├── README.md               # This file
├── start.ps1               # Startup script
└── env.example             # Environment template
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@database:5432/marketing_intel

# Redis Configuration
REDIS_URL=redis://redis:6379

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

## 📈 Monitoring

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs ai-agent
docker-compose logs web-scraper
docker-compose logs api-gateway
```

### Status Check
```bash
# Check service status
docker-compose ps

# Check API health
curl http://localhost:8000/health
```

## 🚀 Usage Examples

### Start Research
```bash
curl -X POST http://localhost:8000/research/start
```

### Get Competitors
```bash
# All competitors
curl http://localhost:8000/competitors

# German market only
curl http://localhost:8000/competitors?market=German

# International market only
curl http://localhost:8000/competitors?market=International
```

### Get Analytics
```bash
# Threat level distribution
curl http://localhost:8000/analytics/threat-levels

# Market distribution
curl http://localhost:8000/analytics/markets
```

## 🛡️ Security Notes

- DeepSeek API key should be kept secure
- Web scraping respects robots.txt and rate limits
- Database credentials are containerized
- API endpoints include CORS protection

## 🔄 Development

### Adding New Data Sources

1. Extend the `WebScraper` class in `web-scraper/main.py`
2. Add new scraping methods
3. Update the database schema if needed
4. Test with Docker Compose

### Modifying AI Analysis

1. Update prompts in `ai-agent/main.py`
2. Adjust DeepSeek API parameters
3. Modify data processing logic
4. Test with sample data

## 📝 Troubleshooting

### Common Issues

1. **Docker not running**
   - Start Docker Desktop
   - Check Docker service status

2. **API key missing**
   - Ensure `.env` file exists
   - Verify DeepSeek API key is set

3. **Database connection issues**
   - Check if database container is running
   - Verify database URL in environment

4. **Web scraping blocked**
   - Check internet connection
   - Verify target sites are accessible
   - Adjust scraping delays if needed

### Debug Commands

```bash
# Rebuild containers
docker-compose down
docker-compose up --build -d

# View detailed logs
docker-compose logs -f

# Access container shell
docker-compose exec ai-agent bash
docker-compose exec api-gateway bash
```

## 📄 License

This project is part of the MEL-25 Marketing Intelligence system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

---

**Note**: This system is designed for educational and research purposes. Ensure compliance with website terms of service when scraping data. 