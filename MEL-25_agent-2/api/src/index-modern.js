const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import services
const { initializeDatabase } = require('./services/database');
const { initializeRedis } = require('./services/redis');
const { initializeOllama } = require('./services/ollama');

// Import routes
const agentRoutes = require('./routes/agents');
const researchRoutes = require('./routes/research');
const workflowRoutes = require('./routes/workflows');
const latexRoutes = require('./routes/latex');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use('/latex', express.static(path.join(__dirname, '../latex')));

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

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/latex', latexRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialize services
    await initializeDatabase();
    await initializeRedis();
    await initializeOllama();
    
    logger.info('All services initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 MEL-25 Agent-2 API server running on port ${PORT} with Node.js 20`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 