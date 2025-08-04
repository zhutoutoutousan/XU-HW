import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

import { database } from './config/database';
import { redis } from './config/redis';
import { setupSocketHandlers } from './socket/handlers';
import { agentRoutes } from './routes/agents';
import { networkRoutes } from './routes/network';
import { metricsRoutes } from './routes/metrics';
import { n8nRoutes } from './routes/n8n';
import { intelligenceRoutes } from './routes/intelligence';
import { errorHandler } from './middleware/errorHandler';
import { agentEngine } from './services/agentEngine';
import { networkAnalyzer } from './services/networkAnalyzer';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agent-network-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env['PORT'] || '8000');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: database.connected ? 'connected' : 'disconnected',
      redis: redis.status === 'ready' ? 'connected' : 'disconnected',
      agentEngine: agentEngine.isRunning() ? 'running' : 'stopped'
    }
  });
});

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// Error handling middleware
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Initialize services
async function initializeServices() {
  try {
    // Test database connection
    await database.testConnection();
    logger.info('Database connected successfully');

    // Connect to Redis and test connection
    await redis.connect();
    await redis.ping();
    logger.info('Redis connected successfully');

    // Start agent engine
    await agentEngine.start();
    logger.info('Agent engine started');

    // Start network analyzer
    await networkAnalyzer.start();
    logger.info('Network analyzer started');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  await agentEngine.stop();
  await networkAnalyzer.stop();
  await database.close();
  await redis.quit();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  await agentEngine.stop();
  await networkAnalyzer.stop();
  await database.close();
  await redis.quit();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  await initializeServices();
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io }; 