"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = __importDefault(require("winston"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const handlers_1 = require("./socket/handlers");
const agents_1 = require("./routes/agents");
const network_1 = require("./routes/network");
const metrics_1 = require("./routes/metrics");
const n8n_1 = require("./routes/n8n");
const errorHandler_1 = require("./middleware/errorHandler");
const agentEngine_1 = require("./services/agentEngine");
const networkAnalyzer_1 = require("./services/networkAnalyzer");
dotenv_1.default.config();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'agent-network-api' },
    transports: [
        new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'combined.log' }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = parseInt(process.env['PORT'] || '8000');
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: database_1.database.connected ? 'connected' : 'disconnected',
            redis: redis_1.redis.status === 'ready' ? 'connected' : 'disconnected',
            agentEngine: agentEngine_1.agentEngine.isRunning() ? 'running' : 'stopped'
        }
    });
});
app.use('/api/agents', agents_1.agentRoutes);
app.use('/api/network', network_1.networkRoutes);
app.use('/api/metrics', metrics_1.metricsRoutes);
app.use('/api/n8n', n8n_1.n8nRoutes);
app.use(errorHandler_1.errorHandler);
(0, handlers_1.setupSocketHandlers)(io);
async function initializeServices() {
    try {
        await database_1.database.testConnection();
        logger.info('Database connected successfully');
        await redis_1.redis.ping();
        logger.info('Redis connected successfully');
        await agentEngine_1.agentEngine.start();
        logger.info('Agent engine started');
        await networkAnalyzer_1.networkAnalyzer.start();
        logger.info('Network analyzer started');
    }
    catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await agentEngine_1.agentEngine.stop();
    await networkAnalyzer_1.networkAnalyzer.stop();
    await database_1.database.close();
    await redis_1.redis.quit();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await agentEngine_1.agentEngine.stop();
    await networkAnalyzer_1.networkAnalyzer.stop();
    await database_1.database.close();
    await redis_1.redis.quit();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
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
//# sourceMappingURL=index.js.map