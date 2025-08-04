-- Initialize the agent network database

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    performance_score DECIMAL(5,2) DEFAULT 0.0,
    cash_flow DECIMAL(15,2) DEFAULT 0.0,
    resources JSONB DEFAULT '{}',
    strategy JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    destroyed_at TIMESTAMP NULL
);

-- Agent relationships (network topology)
CREATE TABLE agent_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    target_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    strength DECIMAL(3,2) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_agent_id, target_agent_id, relationship_type)
);

-- Business transactions between agents
CREATE TABLE agent_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    transaction_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent negotiations
CREATE TABLE agent_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    target_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    negotiation_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    terms JSONB DEFAULT '{}',
    outcome JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Business metrics and KPIs
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent creation/destruction events
CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    triggered_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Network snapshots for visualization
CREATE TABLE network_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_data JSONB NOT NULL,
    agent_count INTEGER NOT NULL,
    relationship_count INTEGER NOT NULL,
    total_performance_score DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_performance ON agents(performance_score);
CREATE INDEX idx_relationships_source ON agent_relationships(source_agent_id);
CREATE INDEX idx_relationships_target ON agent_relationships(target_agent_id);
CREATE INDEX idx_transactions_from ON agent_transactions(from_agent_id);
CREATE INDEX idx_transactions_to ON agent_transactions(to_agent_id);
CREATE INDEX idx_metrics_agent ON business_metrics(agent_id);
CREATE INDEX idx_metrics_name ON business_metrics(metric_name);
CREATE INDEX idx_events_agent ON agent_events(agent_id);
CREATE INDEX idx_events_type ON agent_events(event_type);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON agent_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial seed data
INSERT INTO agents (name, type, performance_score, cash_flow, strategy) VALUES
('Market Analyzer Alpha', 'market_agent', 85.5, 10000.00, '{"strategy": "trend_analysis", "risk_tolerance": "medium"}'),
('Strategy Optimizer Beta', 'strategy_agent', 92.3, 15000.00, '{"strategy": "resource_optimization", "focus": "efficiency"}'),
('Resource Manager Gamma', 'resource_agent', 78.9, 8000.00, '{"strategy": "cost_reduction", "allocation_method": "dynamic"}'),
('Negotiation Specialist Delta', 'negotiation_agent', 88.7, 12000.00, '{"strategy": "win_win", "style": "collaborative"}'),
('Performance Monitor Epsilon', 'performance_agent', 95.1, 20000.00, '{"strategy": "continuous_monitoring", "threshold": "high"}');

-- Create initial relationships
INSERT INTO agent_relationships (source_agent_id, target_agent_id, relationship_type, strength) 
SELECT 
    a1.id as source_agent_id,
    a2.id as target_agent_id,
    'collaboration' as relationship_type,
    0.8 as strength
FROM agents a1, agents a2 
WHERE a1.id != a2.id AND a1.type != a2.type
LIMIT 10; 