"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const pg_1 = require("pg");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.simple(),
    transports: [new winston_1.default.transports.Console()]
});
class Database {
    constructor() {
        this.connected = false;
        this.pool = new pg_1.Pool({
            host: process.env['DB_HOST'] || 'localhost',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: process.env['DB_NAME'] || 'agent_network',
            user: process.env['DB_USER'] || 'agent_user',
            password: process.env['DB_PASSWORD'] || 'agent_password',
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
    async testConnection() {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.connected = true;
            logger.info('Database connection test successful');
        }
        catch (error) {
            this.connected = false;
            logger.error('Database connection test failed:', error);
            throw error;
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug('Executed query', { text, duration, rows: res.rowCount });
            return res;
        }
        catch (error) {
            logger.error('Query error:', { text, error });
            throw error;
        }
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
        this.connected = false;
        logger.info('Database connection pool closed');
    }
}
exports.database = new Database();
//# sourceMappingURL=database.js.map