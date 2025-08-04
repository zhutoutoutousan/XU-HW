const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'MEL-25 Agent-2 API is running',
    services: {
      database: 'postgresql://postgres:password@postgres:5432/research_db',
      redis: 'redis://redis:6379',
      ollama: 'http://ollama:11434'
    }
  });
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'MEL-25 Agent-2 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      agents: '/api/agents',
      bcdResearch: '/api/agents/bcd-research'
    }
  });
});

// Agents endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      {
        id: 'bcd-research-agent',
        name: 'BCD Research Agent',
        status: 'available',
        description: 'Analyzes BCD website and marketing strategy'
      }
    ]
  });
});

// BCD Research endpoint
app.post('/api/agents/bcd-research', (req, res) => {
  res.json({
    message: 'BCD Research initiated',
    taskId: 'bcd-research-' + Date.now(),
    status: 'started',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MEL-25 Agent-2 API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 