const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

const initializeDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connected successfully');
    
    // Initialize tables if they don't exist
    await initializeTables();
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

const initializeTables = async () => {
  const createTablesQuery = `
    -- Agents table
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'idle',
      capabilities JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Research tasks table
    CREATE TABLE IF NOT EXISTS research_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES agents(id),
      task_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      input_data JSONB,
      output_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      error_message TEXT
    );

    -- BCD research data table
    CREATE TABLE IF NOT EXISTS bcd_research (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_url VARCHAR(500),
      content_type VARCHAR(100),
      raw_data JSONB,
      processed_data JSONB,
      analysis_results JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- LaTeX documents table
    CREATE TABLE IF NOT EXISTS latex_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT,
      template VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      pdf_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Workflows table
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      n8n_workflow_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      config JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
    CREATE INDEX IF NOT EXISTS idx_research_tasks_status ON research_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_bcd_research_content_type ON bcd_research(content_type);
    CREATE INDEX IF NOT EXISTS idx_latex_documents_status ON latex_documents(status);
  `;

  try {
    await pool.query(createTablesQuery);
    logger.info('Database tables initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize tables:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
};

const query = async (text, params) => {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
};

module.exports = {
  initializeDatabase,
  getPool,
  query,
  closePool
}; 