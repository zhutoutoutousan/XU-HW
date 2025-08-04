"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("redis");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.simple(),
    transports: [new winston_1.default.transports.Console()]
});
class Redis {
    constructor() {
        this.status = 'disconnected';
        this.client = (0, redis_1.createClient)({
            url: process.env['REDIS_URL'] || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });
        this.client.on('connect', () => {
            logger.info('Redis client connected');
            this.status = 'connected';
        });
        this.client.on('ready', () => {
            logger.info('Redis client ready');
            this.status = 'ready';
        });
        this.client.on('error', (err) => {
            logger.error('Redis client error:', err);
            this.status = 'error';
        });
        this.client.on('end', () => {
            logger.info('Redis client disconnected');
            this.status = 'disconnected';
        });
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async ping() {
        return await this.client.ping();
    }
    async get(key) {
        const result = await this.client.get(key);
        return result;
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.client.setEx(key, ttl, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        return await this.client.del(key);
    }
    async exists(key) {
        return await this.client.exists(key);
    }
    async hget(key, field) {
        const result = await this.client.hGet(key, field);
        return result || null;
    }
    async hset(key, field, value) {
        return await this.client.hSet(key, field, value);
    }
    async hgetall(key) {
        return await this.client.hGetAll(key);
    }
    async publish(channel, message) {
        return await this.client.publish(channel, message);
    }
    async subscribe(channel, callback) {
        await this.client.subscribe(channel, callback);
    }
    async quit() {
        await this.client.quit();
    }
    async cacheAgentData(agentId, data, ttl = 3600) {
        await this.set(`agent:${agentId}`, JSON.stringify(data), ttl);
    }
    async getAgentData(agentId) {
        const data = await this.get(`agent:${agentId}`);
        return data ? JSON.parse(data) : null;
    }
    async cacheNetworkSnapshot(snapshot, ttl = 300) {
        await this.set('network:snapshot', JSON.stringify(snapshot), ttl);
    }
    async getNetworkSnapshot() {
        const snapshot = await this.get('network:snapshot');
        return snapshot ? JSON.parse(snapshot) : null;
    }
    async publishAgentEvent(event) {
        await this.publish('agent:events', JSON.stringify(event));
    }
    async publishNetworkUpdate(update) {
        await this.publish('network:updates', JSON.stringify(update));
    }
}
exports.redis = new Redis();
//# sourceMappingURL=redis.js.map