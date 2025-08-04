-- Initialize marketing intelligence database

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    business_model TEXT,
    target_audience TEXT,
    key_strengths JSONB,
    competitive_advantages JSONB,
    market_position VARCHAR(255),
    threat_level VARCHAR(50),
    market VARCHAR(100),
    raw_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create research sessions table
CREATE TABLE IF NOT EXISTS research_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255),
    target_company VARCHAR(255),
    status VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_competitors_found INTEGER DEFAULT 0,
    german_competitors_found INTEGER DEFAULT 0,
    international_competitors_found INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competitors_market ON competitors(market);
CREATE INDEX IF NOT EXISTS idx_competitors_threat_level ON competitors(threat_level);
CREATE INDEX IF NOT EXISTS idx_competitors_created_at ON competitors(created_at);

-- Create scraped_data table
CREATE TABLE IF NOT EXISTS scraped_data (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    link TEXT,
    snippet TEXT,
    source VARCHAR(255),
    query VARCHAR(500),
    market VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for scraped_data
CREATE INDEX IF NOT EXISTS idx_scraped_data_market ON scraped_data(market);
CREATE INDEX IF NOT EXISTS idx_scraped_data_source ON scraped_data(source);
CREATE INDEX IF NOT EXISTS idx_scraped_data_created_at ON scraped_data(created_at);

-- Insert initial research session
INSERT INTO research_sessions (session_name, target_company, status) 
VALUES ('Initial Research', 'bettercalldominik', 'active')
ON CONFLICT DO NOTHING; 