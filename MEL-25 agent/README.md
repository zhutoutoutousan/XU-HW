# MEL-25 Agent Network

A neuroplasticity-inspired agent network built on n8n for business optimization and survival, inspired by the principles of neural plasticity where networks adapt, grow, and optimize based on performance and environmental conditions.

## 🌟 Overview

This system creates a dynamic network of business agents that can:
- **Create** new agents through negotiation and collaboration
- **Destroy** underperforming agents based on business metrics
- **Negotiate** with other agents to optimize business outcomes
- **Adapt** their strategies based on market conditions and performance

The system operates like a neural network where successful connections are strengthened and underperforming ones are pruned, creating an ever-evolving business ecosystem.

## 🏗️ Architecture

### Core Components

1. **n8n Workflow Engine** - Orchestrates agent interactions and business logic
2. **Agent Engine** - Manages agent lifecycle and decision-making
3. **Network Graph** - Real-time visualization of agent relationships
4. **Business Metrics** - Performance tracking and optimization
5. **API Layer** - RESTful endpoints for agent management

### Agent Types

- **Market Agents** - Analyze market conditions and trends
- **Strategy Agents** - Develop and optimize business strategies
- **Resource Agents** - Manage and allocate business resources
- **Negotiation Agents** - Handle inter-agent communication and deals
- **Performance Agents** - Monitor and evaluate business metrics

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Node.js 18+ (for development)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MEL-25\ agent

# Run the automated setup
.\setup.ps1

# Or manually start the system
docker-compose up -d
```

### Access Points

- **Frontend**: http://localhost:3000
- **n8n**: http://localhost:5678 (admin/admin123)
- **API**: http://localhost:8000
- **Database**: localhost:5432

## 🧠 Neuroplasticity Principles

### Adaptive Learning
Agents continuously learn from their environment and adjust their strategies based on performance metrics and market conditions.

### Dynamic Creation
Successful agents (performance > 80%, positive cash flow) can create new agents to fill market gaps or expand their capabilities.

### Selective Destruction
Underperforming agents (performance < 50% or negative cash flow) are automatically destroyed to optimize network efficiency.

### Relationship Strengthening
Beneficial relationships between agents are strengthened over time, while weak connections are weakened or removed.

### Resource Rebalancing
Resources are dynamically redistributed based on agent performance, ensuring optimal allocation across the network.

## 📊 Features

### Real-time Network Visualization
- Interactive D3.js network graph
- Agent performance indicators
- Relationship strength visualization
- Real-time updates via WebSocket

### Agent Management
- Create new agents with specific types and strategies
- Monitor agent performance and cash flow
- View agent relationships and transactions
- Destroy underperforming agents

### Business Intelligence
- Performance metrics dashboard
- Agent type distribution analysis
- Top/bottom performer tracking
- Network health monitoring

### n8n Integration
- Automated workflow orchestration
- Agent creation/destruction triggers
- Negotiation handling
- Performance evaluation workflows

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_network
DB_USER=agent_user
DB_PASSWORD=agent_password

# Redis
REDIS_URL=redis://localhost:6379

# API
PORT=8000
NODE_ENV=development

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Agent Configuration

Agents can be configured with:
- **Strategy**: JSON-based strategy configuration
- **Resources**: Computational power, memory allocation
- **Performance Thresholds**: Creation/destruction criteria
- **Negotiation Parameters**: Deal-making preferences

## 📈 Business Logic

### Performance Evaluation
Agents are evaluated every 5 minutes based on:
- Revenue growth
- Cost efficiency
- Customer satisfaction
- Market share
- Innovation index

### Creation Triggers
New agents are created when:
- High-performing agents have excess resources
- Market gaps are identified
- Strategic opportunities arise
- Network optimization requires new capabilities

### Destruction Criteria
Agents are destroyed when:
- Performance score drops below 50%
- Cash flow remains negative for extended periods
- Network optimization requires pruning
- Strategic realignment is needed

## 🎯 Use Cases

### Business Process Optimization
- Automate complex business workflows
- Optimize resource allocation
- Improve decision-making processes
- Reduce operational costs

### Market Analysis
- Real-time market trend analysis
- Competitive intelligence gathering
- Risk assessment and mitigation
- Opportunity identification

### Strategic Planning
- Dynamic strategy development
- Scenario planning and simulation
- Performance optimization
- Resource planning

### Network Management
- Relationship optimization
- Partnership formation
- Conflict resolution
- Collaboration enhancement

## 🔍 Monitoring

### System Health
```bash
# Check system status
curl http://localhost:8000/health

# View logs
docker-compose logs -f

# Monitor performance
docker stats
```

### Agent Metrics
- Performance scores
- Cash flow analysis
- Relationship strength
- Creation/destruction rates

### Network Analytics
- Agent type distribution
- Relationship density
- Performance trends
- Network evolution

## 🛠️ Development

### Adding New Agent Types

1. **Define Agent Behavior**
   ```typescript
   // api/src/services/agentEngine.ts
   private generateStrategy(type: string): any {
     switch (type) {
       case 'new_agent_type':
         return { strategy: 'new_approach', focus: 'new_domain' };
     }
   }
   ```

2. **Update Frontend**
   ```svelte
   <!-- frontend/src/lib/components/NetworkGraph.svelte -->
   const agentColors = {
     'new_agent_type': '#new-color'
   };
   ```

3. **Add Database Support**
   ```sql
   -- database/init.sql
   INSERT INTO agents (name, type, strategy) VALUES 
   ('New Agent', 'new_agent_type', '{"strategy": "new_approach"}');
   ```

### Creating n8n Workflows

1. Access n8n at http://localhost:5678
2. Create new workflow
3. Configure triggers and actions
4. Export to `n8n/workflows/`

### Extending the API

```typescript
// api/src/routes/newFeature.ts
import { Router } from 'express';

const router = Router();

router.get('/endpoint', async (req, res) => {
  // Your logic here
});

export { router as newFeatureRoutes };
```

## 📚 Documentation

- [Development Guide](DEVELOPMENT.md) - Detailed development instructions
- [API Documentation](http://localhost:8000/api/docs) - API reference
- [n8n Documentation](https://docs.n8n.io/) - Workflow engine docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **n8n** - Workflow automation platform
- **SvelteKit** - Modern frontend framework
- **D3.js** - Data visualization library
- **PostgreSQL** - Reliable database system
- **Redis** - High-performance caching

## 🆘 Support

For questions or issues:

1. Check the [troubleshooting section](DEVELOPMENT.md#troubleshooting)
2. Review the logs: `docker-compose logs`
3. Create an issue with detailed information
4. Contact the development team

---

**MEL-25 Agent Network** - Where business meets neuroplasticity, creating a self-optimizing ecosystem that adapts, learns, and evolves for maximum business success.

*Inspired by the remarkable adaptability of neural networks, this system brings the same principles to business optimization.* 