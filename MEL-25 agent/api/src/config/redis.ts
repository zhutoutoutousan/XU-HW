import { createClient, RedisClientType } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class Redis {
  private client: RedisClientType;
  public status: string = 'disconnected';

  constructor() {
    this.client = createClient({
      url: process.env['REDIS_URL'] || 'redis://redis:6379',
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

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.get(key);
    return result;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async hget(key: string, field: string): Promise<string | null> {
    const result = await this.client.hGet(key, field);
    return result || null;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.client.subscribe(channel, callback);
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }

  // Agent-specific methods
  async cacheAgentData(agentId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`agent:${agentId}`, JSON.stringify(data), ttl);
  }

  async getAgentData(agentId: string): Promise<any | null> {
    const data = await this.get(`agent:${agentId}`);
    return data ? JSON.parse(data) : null;
  }

  async cacheNetworkSnapshot(snapshot: any, ttl: number = 300): Promise<void> {
    await this.set('network:snapshot', JSON.stringify(snapshot), ttl);
  }

  async getNetworkSnapshot(): Promise<any | null> {
    const snapshot = await this.get('network:snapshot');
    return snapshot ? JSON.parse(snapshot) : null;
  }

  async publishAgentEvent(event: any): Promise<void> {
    await this.publish('agent:events', JSON.stringify(event));
  }

  async publishNetworkUpdate(update: any): Promise<void> {
    await this.publish('network:updates', JSON.stringify(update));
  }
}

export const redis = new Redis(); 