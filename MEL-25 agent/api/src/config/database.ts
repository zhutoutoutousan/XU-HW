import { Pool, PoolClient } from 'pg';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class Database {
  private pool: Pool;
  public connected: boolean = false;

  constructor() {
    const databaseUrl = process.env['DATABASE_URL'] || 'postgresql://agent_user:agent_password@localhost:5432/agent_network';
    
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      this.connected = false;
    });

    this.pool.on('connect', () => {
      logger.info('New database connection established');
      this.connected = true;
    });
  }

  async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.connected = true;
      logger.info('Database connection test successful');
    } catch (error) {
      this.connected = false;
      logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Query error:', { text, error });
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    logger.info('Database connection pool closed');
  }
}

export const database = new Database(); 