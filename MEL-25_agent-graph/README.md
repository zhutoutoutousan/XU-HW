# Marketing Analysis Strategy Department - Graph-Based Agent Network

A sophisticated marketing analysis system using a graph-based agent network to analyze marketing strategies, competitor data, and generate comprehensive reports ready for LaTeX paper conversion.

## Overview

This system implements a marketing analysis strategy department with specialized agents powered by Ollama, connected through a Neo4j graph database. Each agent represents a node in the graph, containing conversation history, inter-agent communication, task assignments, and specialized tools.

## Architecture

### Core Components

1. **Neo4j Graph Database**: Stores agent nodes, relationships, conversation history, and task dependencies
2. **Ollama LLM Service**: Powers intelligent analysis capabilities for all agents
3. **Agent Network**: Specialized agents for different marketing analysis tasks
4. **Docker Compose**: Containerized services for easy deployment and scalability

### Agent Types

- **Research Agent**: Web scraping, data collection, market research
- **Analysis Agent**: Data processing, pattern recognition, insights generation
- **Strategy Agent**: Strategy formulation, competitive analysis, recommendations
- **Report Agent**: Report generation, LaTeX formatting, visualization
- **Coordination Agent**: Workflow orchestration, task distribution

## Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 8GB RAM (for Ollama models)
- Internet connection for web scraping

### Setup

1. **Clone and navigate to the project**:
   ```bash
   cd MEL-25_agent-graph
   ```

2. **Start the system**:
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to initialize** (may take 5-10 minutes for first startup):
   - Neo4j will be available at http://localhost:7474
   - Ollama will be available at http://localhost:11434
   - Orchestrator API will be available at http://localhost:8000

4. **Pull Ollama models** (optional, for better performance):
   ```bash
   docker exec marketing_analysis_ollama ollama pull llama2
   docker exec marketing_analysis_ollama ollama pull mistral
   ```

### Usage

#### 1. Create a Marketing Analysis Task

```bash
curl -X POST "http://localhost:8000/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "marketing_analysis",
    "target_url": "https://bettercalldominik.com/",
    "analysis_scope": ["content", "structure", "links", "metadata"],
    "priority": "high"
  }'
```

#### 2. Check Task Status

```bash
curl "http://localhost:8000/task/{task_id}"
```

#### 3. Monitor Agent Status

```bash
curl "http://localhost:8000/agents"
```

## Workflow Example: BCD Website Analysis

### Phase 1: Research
1. **Research Agent** scrapes the BCD website
2. Extracts content, structure, links, and metadata
3. Performs special BCD-specific analysis
4. Stores results in Neo4j graph

### Phase 2: Analysis
1. **Analysis Agent** processes scraped data
2. Identifies patterns and insights
3. Generates market analysis
4. Creates data visualizations

### Phase 3: Strategy
1. **Strategy Agent** formulates recommendations
2. Analyzes competitive positioning
3. Creates strategic framework
4. Generates actionable insights

### Phase 4: Reporting
1. **Report Agent** compiles all findings
2. Generates LaTeX-ready report
3. Creates visualizations and charts
4. Produces final analysis document

## BCD Website Analysis Features

The system includes specialized analysis for the BCD website:

### Business Model Analysis
- Exclusive network/community identification
- Membership-based revenue model detection
- Value proposition extraction

### Target Audience Analysis
- Entrepreneurs and investors identification
- Family office targeting
- Geographic and demographic analysis

### Marketing Strategy Analysis
- Event marketing detection
- Community marketing channels
- Exclusivity marketing elements

### Competitive Positioning
- Direct competitor identification
- Indirect competitor analysis
- Market positioning assessment

## Graph Database Schema

### Node Types
- **Agent**: Represents agents with capabilities and status
- **Task**: Main tasks with priority and scope
- **SubTask**: Individual agent tasks
- **Result**: Task outputs and analysis results
- **Communication**: Inter-agent messages
- **Data**: Raw and processed data

### Relationship Types
- **COORDINATES**: Coordination agent manages other agents
- **ASSIGNED_TO**: Agent assigned to task
- **CONTAINS**: Task contains subtasks
- **PRODUCES**: Task produces results
- **COMMUNICATES_WITH**: Agents communicate with each other

## API Endpoints

### Orchestrator API (Port 8000)

- `POST /task`: Create new analysis task
- `GET /agents`: Get status of all agents
- `GET /task/{task_id}`: Get task status and results
- `GET /health`: Health check

### Agent APIs (Internal)

Each agent exposes:
- `POST /task`: Process assigned tasks
- `GET /health`: Health check

## Monitoring and Observability

### Neo4j Browser
- Access at http://localhost:7474
- Username: neo4j
- Password: password
- Explore graph relationships and data

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs research_agent
docker-compose logs analysis_agent
docker-compose logs strategy_agent
docker-compose logs report_agent
```

### Health Checks
```bash
# Check orchestrator
curl http://localhost:8000/health

# Check Neo4j
curl http://localhost:7474/browser/

# Check Ollama
curl http://localhost:11434/api/tags
```

## Configuration

### Environment Variables

Key environment variables in `docker-compose.yml`:

- `NEO4J_AUTH`: Neo4j authentication
- `OLLAMA_HOST`: Ollama service host
- `AGENT_TYPE`: Agent specialization

### Customization

1. **Add new agent types**: Create new agent directory and update docker-compose.yml
2. **Modify analysis scope**: Update agent capabilities and tools
3. **Add external APIs**: Integrate with market research APIs
4. **Customize LaTeX templates**: Modify report agent templates

## Development

### Adding New Agents

1. Create agent directory:
   ```bash
   mkdir agents/new_agent_type
   ```

2. Create Dockerfile and requirements.txt

3. Implement agent logic in `new_agent_type.py`

4. Update docker-compose.yml

5. Add agent to orchestrator

### Extending Analysis Capabilities

1. Add new tools to agent requirements.txt
2. Implement new analysis methods
3. Update graph schema if needed
4. Test with sample data

## Troubleshooting

### Common Issues

1. **Neo4j connection errors**:
   - Wait for Neo4j to fully start (check logs)
   - Verify credentials in docker-compose.yml

2. **Ollama model not found**:
   - Pull required models: `docker exec marketing_analysis_ollama ollama pull llama2`

3. **Agent communication failures**:
   - Check network connectivity between containers
   - Verify agent URLs in orchestrator

4. **Memory issues**:
   - Increase Docker memory allocation
   - Use smaller Ollama models

### Debug Mode

Enable debug logging:
```bash
# Set log level in docker-compose.yml
environment:
  - LOG_LEVEL=DEBUG
```

## Security Considerations

- All communication between agents is internal
- Neo4j access is restricted to internal network
- No sensitive data is exposed externally
- Input validation on all API endpoints

## Performance Optimization

- Use appropriate Ollama models for your use case
- Scale agent instances based on workload
- Optimize Neo4j queries for large datasets
- Implement caching for frequently accessed data

## Future Enhancements

- Real-time collaboration between agents
- Machine learning model training
- Advanced natural language processing
- Integration with external data sources
- Plugin system for new agent types
- Marketplace for agent capabilities

## License

This project is for educational and research purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify system requirements
4. Test with minimal configuration 