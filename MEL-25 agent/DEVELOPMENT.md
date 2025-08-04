# Development Guide - MEL-25 Agent Network

## Overview

This document provides detailed instructions for developing and extending the neuroplasticity-inspired agent network system.

## Architecture

### System Components

1. **n8n Workflow Engine** - Orchestrates agent interactions and business logic
2. **API Server** - RESTful endpoints for agent management
3. **Frontend** - SvelteKit-based network visualization
4. **Database** - PostgreSQL for persistent storage
5. **Redis** - Caching and real-time features
6. **Agent Engine** - Core business logic for agent lifecycle

### Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: SvelteKit, D3.js, Socket.IO
- **Database**: PostgreSQL
- **Cache**: Redis
- **Workflow**: n8n
- **Containerization**: Docker, Docker Compose

## Development Setup

### Prerequisites

1. **Docker Desktop** - For containerized development
2. **Node.js 18+** - For local development
3. **Git** - Version control

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd MEL-25\ agent

# Run the setup script
.\setup.ps1

# Or manually start the system
docker-compose up -d
```

### Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
cd api && npm install
cd ../frontend && npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 3. Start the system
docker-compose up -d
```

## Development Workflow

### 1. API Development

The API server is located in `api/src/`:

```
api/src/
├── config/          # Database, Redis configuration
├── routes/          # Express route handlers
├── services/        # Business logic (Agent Engine)
├── middleware/      # Express middleware
├── socket/          # Socket.IO handlers
└── index.ts         # Main server entry point
```

#### Adding New Routes

```typescript
// api/src/routes/newFeature.ts
import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/endpoint', async (req, res) => {
    try {
        // Your logic here
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

export { router as newFeatureRoutes };
```

#### Adding New Services

```typescript
// api/src/services/newService.ts
import winston from 'winston';

class NewService {
    private isRunning: boolean = false;

    async start(): Promise<void> {
        this.isRunning = true;
        // Your service logic
    }

    async stop(): Promise<void> {
        this.isRunning = false;
    }
}

export const newService = new NewService();
```

### 2. Frontend Development

The frontend is built with SvelteKit:

```
frontend/src/
├── lib/
│   ├── components/   # Reusable components
│   ├── stores.ts     # State management
│   └── socket.ts     # WebSocket client
├── routes/           # SvelteKit pages
└── app.html          # Main HTML template
```

#### Adding New Components

```svelte
<!-- frontend/src/lib/components/NewComponent.svelte -->
<script lang="ts">
    export let data: any;
    
    function handleClick() {
        // Component logic
    }
</script>

<div class="new-component">
    <!-- Component template -->
</div>

<style>
    .new-component {
        /* Component styles */
    }
</style>
```

#### Adding New Pages

```svelte
<!-- frontend/src/routes/new-page/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    
    onMount(() => {
        // Page initialization
    });
</script>

<svelte:head>
    <title>New Page</title>
</svelte:head>

<div class="page">
    <!-- Page content -->
</div>
```

### 3. n8n Workflow Development

n8n workflows are stored in `n8n/workflows/`:

#### Creating New Workflows

1. Access n8n at `http://localhost:5678`
2. Login with `admin/admin123`
3. Create new workflow
4. Export workflow to `n8n/workflows/`

#### Workflow Types

- **Agent Creation** - Triggered when new agents are created
- **Agent Destruction** - Triggered when agents are destroyed
- **Negotiation** - Handles agent-to-agent negotiations
- **Performance Evaluation** - Evaluates agent performance
- **Network Optimization** - Optimizes network topology

### 4. Database Schema

The database schema is defined in `database/init.sql`:

#### Adding New Tables

```sql
-- Add to database/init.sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Adding New Columns

```sql
-- Add to existing table
ALTER TABLE agents ADD COLUMN new_field VARCHAR(100);
```

## Agent Types and Behaviors

### Market Agents
- **Purpose**: Analyze market conditions and trends
- **Behaviors**: Data analysis, trend prediction, market research
- **Creation**: Triggered by market gaps or high-performing agents
- **Destruction**: Poor market analysis performance

### Strategy Agents
- **Purpose**: Develop and optimize business strategies
- **Behaviors**: Strategy planning, resource optimization, risk assessment
- **Creation**: Triggered by strategic needs
- **Destruction**: Ineffective strategy development

### Resource Agents
- **Purpose**: Manage and allocate business resources
- **Behaviors**: Resource allocation, cost optimization, efficiency management
- **Creation**: Triggered by resource management needs
- **Destruction**: Poor resource utilization

### Negotiation Agents
- **Purpose**: Handle inter-agent communication and deals
- **Behaviors**: Deal negotiation, partnership formation, conflict resolution
- **Creation**: Triggered by negotiation needs
- **Destruction**: Failed negotiations

### Performance Agents
- **Purpose**: Monitor and evaluate business metrics
- **Behaviors**: KPI tracking, performance analysis, reporting
- **Creation**: Triggered by monitoring needs
- **Destruction**: Poor monitoring performance

## Neuroplasticity Implementation

### Key Concepts

1. **Adaptive Learning**: Agents learn from their environment and adjust strategies
2. **Dynamic Creation**: Successful agents create new agents based on market needs
3. **Selective Destruction**: Underperforming agents are removed to optimize the network
4. **Relationship Strengthening**: Beneficial relationships are strengthened over time
5. **Resource Rebalancing**: Resources are redistributed based on performance

### Implementation Details

#### Agent Evaluation Cycle

```typescript
// Every 5 minutes
cron.schedule('*/5 * * * *', () => {
    this.evaluateAgents();
});

// Every 6 hours
cron.schedule('0 */6 * * *', () => {
    this.optimizeNetwork();
});

// Every 15 minutes
cron.schedule('*/15 * * * *', () => {
    this.identifyCreationOpportunities();
});
```

#### Performance Calculation

```typescript
private async calculatePerformanceScore(agent: Agent): Promise<number> {
    const metrics = await this.getAgentMetrics(agent.id);
    let score = agent.performance_score;
    
    // Adjust based on business metrics
    for (const metric of metrics) {
        switch (metric.metric_name) {
            case 'revenue_growth':
                score += metric.avg_value * 0.3;
                break;
            case 'cost_efficiency':
                score += metric.avg_value * 0.2;
                break;
            // ... more metrics
        }
    }
    
    return Math.max(0, Math.min(100, score));
}
```

## Testing

### API Testing

```bash
# Run API tests
cd api
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run component tests
npm run test:components
```

### Integration Testing

```bash
# Run full system tests
docker-compose -f docker-compose.test.yml up --build
```

## Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL=postgresql://user:pass@host:port/db
   export REDIS_URL=redis://host:port
   ```

2. **Database Migration**
   ```bash
   # Run database migrations
   npm run migrate
   ```

3. **Build and Deploy**
   ```bash
   # Build the system
   docker-compose -f docker-compose.prod.yml build
   
   # Deploy
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Monitoring

- **Logs**: `docker-compose logs -f`
- **Metrics**: Access Grafana dashboard
- **Health Checks**: `/health` endpoint
- **Performance**: Monitor agent performance scores

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Frontend Not Loading**
   ```bash
   # Check if frontend is built
   cd frontend && npm run build
   
   # Check logs
   docker-compose logs frontend
   ```

3. **n8n Workflows Not Triggering**
   ```bash
   # Check n8n logs
   docker-compose logs n8n
   
   # Verify webhook URLs
   curl http://localhost:5678/webhook/test
   ```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=agent-network:*

# Run in debug mode
docker-compose -f docker-compose.debug.yml up
```

## Contributing

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Standard configuration
- **Prettier**: Automatic formatting
- **Svelte**: Component-based architecture

### Git Workflow

1. Create feature branch
2. Make changes
3. Add tests
4. Update documentation
5. Submit pull request

### Documentation

- Update README.md for user-facing changes
- Update DEVELOPMENT.md for developer-facing changes
- Add inline comments for complex logic

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [D3.js Documentation](https://d3js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## Support

For questions or issues:

1. Check the troubleshooting section
2. Review the logs: `docker-compose logs`
3. Create an issue with detailed information
4. Contact the development team

---

This development guide should help you understand and extend the MEL-25 Agent Network system. The neuroplasticity-inspired approach creates a dynamic, self-optimizing business network that continuously adapts to market conditions and performance metrics. 