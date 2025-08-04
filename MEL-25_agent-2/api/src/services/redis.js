const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const initializeRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await client.connect();
    
    // Test connection
    await client.ping();
    logger.info('Redis connection test successful');
    
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis not initialized');
  }
  return client;
};

// Cache operations
const setCache = async (key, value, ttl = 3600) => {
  try {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    await getClient().setEx(key, ttl, serializedValue);
    logger.debug(`Cache set: ${key}`);
  } catch (error) {
    logger.error('Cache set error:', error);
    throw error;
  }
};

const getCache = async (key) => {
  try {
    const value = await getClient().get(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    throw error;
  }
};

const deleteCache = async (key) => {
  try {
    await getClient().del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error('Cache delete error:', error);
    throw error;
  }
};

const clearCache = async () => {
  try {
    await getClient().flushAll();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
    throw error;
  }
};

// Queue operations
const addToQueue = async (queueName, data) => {
  try {
    const serializedData = typeof data === 'object' ? JSON.stringify(data) : data;
    await getClient().lPush(queueName, serializedData);
    logger.debug(`Added to queue ${queueName}: ${JSON.stringify(data).substring(0, 100)}`);
  } catch (error) {
    logger.error('Queue add error:', error);
    throw error;
  }
};

const getFromQueue = async (queueName) => {
  try {
    const data = await getClient().rPop(queueName);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return null;
  } catch (error) {
    logger.error('Queue get error:', error);
    throw error;
  }
};

const getQueueLength = async (queueName) => {
  try {
    return await getClient().lLen(queueName);
  } catch (error) {
    logger.error('Queue length error:', error);
    throw error;
  }
};

// Agent task queue
const addAgentTask = async (agentType, task) => {
  const queueName = `agent_tasks:${agentType}`;
  return await addToQueue(queueName, task);
};

const getAgentTask = async (agentType) => {
  const queueName = `agent_tasks:${agentType}`;
  return await getFromQueue(queueName);
};

const getAgentTaskCount = async (agentType) => {
  const queueName = `agent_tasks:${agentType}`;
  return await getQueueLength(queueName);
};

// Research data cache
const cacheResearchData = async (source, data) => {
  const key = `research:${source}`;
  return await setCache(key, data, 86400); // 24 hours
};

const getResearchData = async (source) => {
  const key = `research:${source}`;
  return await getCache(key);
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  initializeRedis,
  getClient,
  setCache,
  getCache,
  deleteCache,
  clearCache,
  addToQueue,
  getFromQueue,
  getQueueLength,
  addAgentTask,
  getAgentTask,
  getAgentTaskCount,
  cacheResearchData,
  getResearchData,
  closeRedis
}; 