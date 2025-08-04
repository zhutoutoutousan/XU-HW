# MEL-25 Agent-2: BCD Marketing Strategy Research System

## Overview

MEL-25 Agent-2 is a comprehensive backend-focused research automation system specifically designed to analyze Better Call Dominik (BCD) and generate comprehensive marketing strategy papers. The system scrapes, aggregates, researches, and generates LaTeX papers focused on BCD's exclusive network business model and market positioning.

## 🎯 Research Focus: Better Call Dominik (BCD)

**Target**: Exclusive network of 550+ successful entrepreneurs, investors, and family offices in DACH region  
**Business Model**: High-end networking platform with premium membership model  
**Key Value Propositions**: Trust-based community, deal flow exchange, knowledge sharing, exclusive events

## 🏗️ Architecture

### Core Components

1. **API Service (Node.js/Express)** - Agent orchestration and data processing
2. **n8n Workflow Engine** - Complex research workflow automation
3. **Agent System** - Intelligent BCD research and marketing strategy generation
4. **PostgreSQL Database** - Data storage and management
5. **Redis Cache** - Real-time processing and caching
6. **Ollama LLM** - Content generation and analysis
7. **LaTeX Service** - Document compilation and formatting

### Agent Types

- **BCD Research Agent**: Website analysis, competitor research, market intelligence
- **Marketing Strategy Agent**: Marketing analysis, strategy development, positioning research
- **Business Model Agent**: Revenue model analysis, value proposition research, scalability assessment
- **LaTeX Agent**: Document formatting and compilation for marketing strategy papers

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 8GB RAM (for Ollama LLM)
- 20GB free disk space

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MEL-25_agent-2
   ```

2. **Start the system**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database**
   ```bash
   docker-compose exec postgres psql -U postgres -d research_db -f /docker-entrypoint-initdb.d/init.sql
   ```

4. **Access the services**
   - API: http://localhost:8000
   - n8n: http://localhost:5678 (admin/secure_password)
   - Health Check: http://localhost:8000/health

### First Run

1. **Start BCD Research**
   ```bash
   curl -X POST http://localhost:8000/api/agents/bcd-research/run \
     -H "Content-Type: application/json" \
     -d '{"researchType": "full"}'
   ```

2. **Generate Marketing Strategy Document**
   ```bash
   curl -X POST http://localhost:8000/api/latex/generate-bcd-strategy \
     -H "Content-Type: application/json" \
     -d '{"title": "BCD Marketing Strategy Research"}'
   ```

3. **Trigger n8n Workflow**
   ```bash
   curl -X POST http://localhost:5678/webhook/bcd-analysis
   ```

## 📊 API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/bcd-research/run` - Run BCD research
- `GET /api/agents/bcd-research/results` - Get research results

### Research
- `GET /api/research` - List research data
- `GET /api/research/stats/summary` - Get research statistics
- `POST /api/research` - Create research entry

### LaTeX Documents
- `GET /api/latex` - List LaTeX documents
- `POST /api/latex/generate-bcd-strategy` - Generate BCD strategy document
- `POST /api/latex/:id/compile` - Compile document to PDF

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows/:id/trigger` - Trigger workflow

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/research_db
REDIS_URL=redis://redis:6379

# LLM
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama2

# n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# LaTeX
LATEX_COMPILER=pdflatex
BIBTEX_COMPILER=bibtex
```

### Docker Services

- **API**: Node.js Express server (port 8000)
- **n8n**: Workflow automation (port 5678)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache and queues (port 6379)
- **Ollama**: LLM service (port 11434)
- **LaTeX**: Document compilation service

## 📁 Project Structure

```
MEL-25_agent-2/
├── api/                          # Node.js API service
│   ├── src/
│   │   ├── agents/              # Agent implementations
│   │   ├── routes/              # API routes
│   │   ├── services/            # Database, Redis, Ollama services
│   │   ├── middleware/          # Express middleware
│   │   └── utils/               # Utilities and helpers
│   ├── package.json
│   └── Dockerfile
├── n8n/                         # n8n workflow engine
│   ├── workflows/               # Workflow definitions
│   └── data/                    # n8n data
├── database/                    # Database initialization
│   └── init.sql
├── latex/                       # LaTeX service
│   ├── templates/               # LaTeX templates
│   ├── output/                  # Compiled documents
│   └── Dockerfile
├── data/                        # Research data
│   ├── raw/                     # Raw scraped data
│   ├── processed/               # Processed research data
│   └── output/                  # Generated reports
├── docker-compose.yml           # Docker orchestration
└── README.md
```

## 🔄 Research Pipeline

### Phase 1: BCD Data Collection
- BCD website scraping and analysis
- Competitor website analysis
- Market research data collection
- Social media presence analysis

### Phase 2: Data Processing
- Data cleaning and normalization
- Text extraction and analysis
- Statistical processing
- Content categorization

### Phase 3: BCD Research & Analysis
- BCD business model analysis
- Competitive positioning research
- Market opportunity identification
- Marketing strategy insights

### Phase 4: Strategy Content Generation
- BCD marketing strategy sections
- Competitive analysis reports
- Market opportunity assessments
- Business model recommendations

### Phase 5: LaTeX Generation
- Document structure creation
- Content formatting
- Citation insertion
- Bibliography generation
- PDF compilation

## 📈 Monitoring and Logs

### Health Checks
- API: `GET /health`
- Database: Check PostgreSQL connection
- Redis: Check Redis connection
- Ollama: Check LLM availability

### Logs
- API logs: `docker-compose logs api`
- n8n logs: `docker-compose logs n8n`
- Database logs: `docker-compose logs postgres`

### Metrics
- Agent status: `GET /api/agents/:id/status`
- Research statistics: `GET /api/research/stats/summary`
- Task queue status: Redis monitoring

## 🛠️ Development

### Adding New Agents

1. Create agent class in `api/src/agents/`
2. Implement required methods
3. Add routes in `api/src/routes/agents.js`
4. Update database schema if needed

### Adding New Workflows

1. Create workflow JSON in `n8n/workflows/`
2. Import into n8n interface
3. Configure webhooks and triggers
4. Test workflow execution

### Customizing LaTeX Templates

1. Add template in `latex/templates/`
2. Update LaTeX service to use template
3. Configure document structure
4. Test compilation

## 🚨 Troubleshooting

### Common Issues

1. **Ollama not responding**
   - Check if Ollama container is running
   - Verify model is downloaded: `docker-compose exec ollama ollama list`

2. **Database connection failed**
   - Check PostgreSQL container status
   - Verify database initialization: `docker-compose logs postgres`

3. **n8n workflows not triggering**
   - Check n8n container status
   - Verify webhook URLs and authentication

4. **LaTeX compilation failed**
   - Check LaTeX service logs
   - Verify template syntax and dependencies

### Debug Commands

```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart api

# Access database
docker-compose exec postgres psql -U postgres -d research_db

# Check Redis
docker-compose exec redis redis-cli ping
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details

---

**MEL-25 Agent-2** - Automated BCD Marketing Strategy Research System 