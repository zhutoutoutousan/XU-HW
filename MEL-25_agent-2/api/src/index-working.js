const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'MEL-25 Agent-2 API is running with Node.js 20',
    services: {
      database: 'postgresql://postgres:password@postgres:5432/research_db',
      redis: 'redis://redis:6379',
      ollama: 'http://ollama:11434'
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'MEL-25 Agent-2 API',
    version: '1.0.0',
    nodeVersion: process.version,
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
      },
      {
        id: 'ollama-agent',
        name: 'Ollama LLM Agent',
        status: 'available',
        description: 'Generates content using Ollama LLM'
      }
    ]
  });
});

// BCD Research endpoint
app.post('/api/agents/bcd-research', async (req, res) => {
  try {
    res.json({
      message: 'BCD Research initiated',
      taskId: 'bcd-research-' + Date.now(),
      status: 'started',
      timestamp: new Date().toISOString(),
      nextSteps: [
        'Website analysis',
        'Competitor research',
        'Market analysis',
        'Strategy generation'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate BCD research',
      message: error.message
    });
  }
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
  console.log(`🚀 MEL-25 Agent-2 API server running on port ${PORT} with Node.js 20`);
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