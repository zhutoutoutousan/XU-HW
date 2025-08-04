-- MEL-25 Agent-2 Database Initialization
-- PostgreSQL database schema for BCD Marketing Strategy Research

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'idle',
  capabilities JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create research tasks table
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

-- Create BCD research data table
CREATE TABLE IF NOT EXISTS bcd_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url VARCHAR(500),
  content_type VARCHAR(100),
  raw_data JSONB,
  processed_data JSONB,
  analysis_results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create LaTeX documents table
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

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  n8n_workflow_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_research_tasks_status ON research_tasks(status);
CREATE INDEX IF NOT EXISTS idx_research_tasks_agent_id ON research_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_bcd_research_content_type ON bcd_research(content_type);
CREATE INDEX IF NOT EXISTS idx_bcd_research_created_at ON bcd_research(created_at);
CREATE INDEX IF NOT EXISTS idx_latex_documents_status ON latex_documents(status);
CREATE INDEX IF NOT EXISTS idx_latex_documents_template ON latex_documents(template);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

-- Insert default agents
INSERT INTO agents (name, type, capabilities) VALUES
  ('BCD Research Agent', 'bcd_research', '["bcd_website_analysis", "competitor_research", "market_intelligence", "business_model_analysis"]'),
  ('Marketing Strategy Agent', 'marketing_strategy', '["marketing_analysis", "strategy_development", "positioning_research", "campaign_planning"]'),
  ('Business Model Agent', 'business_model', '["revenue_model_analysis", "value_proposition_research", "scalability_assessment", "market_opportunity_analysis"]'),
  ('LaTeX Agent', 'latex', '["document_structure", "formatting", "citation_management", "compilation"]')
ON CONFLICT DO NOTHING;

-- Insert default workflows
INSERT INTO workflows (name, n8n_workflow_id, config) VALUES
  ('BCD Analysis Pipeline', 'bcd-analysis-pipeline', '{"trigger": "manual", "steps": ["bcd_website_scraping", "competitor_analysis", "market_research", "strategy_development", "latex_output"]}'),
  ('Marketing Strategy Research', 'marketing-strategy-research', '{"trigger": "manual", "steps": ["bcd_data_collection", "competitive_intelligence", "market_analysis", "strategy_recommendations", "marketing_paper"]}'),
  ('Business Model Analysis', 'business-model-analysis', '{"trigger": "manual", "steps": ["business_data_collection", "revenue_analysis", "value_proposition_research", "scalability_assessment", "strategy_paper"]}')
ON CONFLICT DO NOTHING;

-- Create views for easier querying
CREATE OR REPLACE VIEW agent_status_summary AS
SELECT 
  type,
  COUNT(*) as total_agents,
  COUNT(CASE WHEN status = 'idle' THEN 1 END) as idle_agents,
  COUNT(CASE WHEN status = 'working' THEN 1 END) as working_agents,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_agents
FROM agents
GROUP BY type;

CREATE OR REPLACE VIEW research_summary AS
SELECT 
  content_type,
  COUNT(*) as total_research,
  COUNT(CASE WHEN analysis_results IS NOT NULL THEN 1 END) as analyzed_research,
  MAX(created_at) as latest_research
FROM bcd_research
GROUP BY content_type;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_agent_status(
  agent_id UUID,
  new_status VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  UPDATE agents 
  SET status = new_status, updated_at = CURRENT_TIMESTAMP 
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_research_task(
  task_id UUID,
  output_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE research_tasks 
  SET status = 'completed', 
      output_data = output_data, 
      completed_at = CURRENT_TIMESTAMP 
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO research_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO research_user;

COMMIT; 