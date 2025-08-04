const express = require('express');
const router = express.Router();
const { query } = require('../services/database');
const { addAgentTask, getAgentTask, getAgentTaskCount } = require('../services/redis');
const BCDResearchAgent = require('../agents/bcdResearchAgent');
const logger = require('../utils/logger');

// Initialize agents
const bcdResearchAgent = new BCDResearchAgent();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM agents ORDER BY created_at DESC');
    res.json({
      agents: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Failed to get agents:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM agents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get agent:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// Get agent status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get agent from database
    const result = await query('SELECT * FROM agents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const agent = result.rows[0];
    
    // Get task count from Redis
    const taskCount = await getAgentTaskCount(agent.type);
    
    res.json({
      ...agent,
      taskCount,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

// Create new agent
router.post('/', async (req, res) => {
  try {
    const { name, type, capabilities } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const result = await query(
      'INSERT INTO agents (name, type, capabilities) VALUES ($1, $2, $3) RETURNING *',
      [name, type, capabilities || []]
    );
    
    logger.info(`Created new agent: ${name} (${type})`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to create agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Start BCD research
router.post('/bcd-research/start', async (req, res) => {
  try {
    const { researchType = 'full' } = req.body;
    
    logger.info(`Starting BCD research: ${researchType}`);
    
    // Add task to queue
    await addAgentTask('bcd_research', {
      type: researchType,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'manual'
    });
    
    res.json({
      message: 'BCD research started',
      researchType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to start BCD research:', error);
    res.status(500).json({ error: 'Failed to start BCD research' });
  }
});

// Run BCD research directly
router.post('/bcd-research/run', async (req, res) => {
  try {
    const { researchType = 'full' } = req.body;
    
    logger.info(`Running BCD research directly: ${researchType}`);
    
    let result;
    
    switch (researchType) {
      case 'website':
        result = await bcdResearchAgent.analyzeBCDWebsite();
        break;
      case 'competitors':
        result = await bcdResearchAgent.researchCompetitors();
        break;
      case 'market':
        result = await bcdResearchAgent.gatherMarketData();
        break;
      case 'business_model':
        result = await bcdResearchAgent.assessBusinessModel();
        break;
      case 'full':
      default:
        result = await bcdResearchAgent.runFullResearch();
        break;
    }
    
    res.json({
      message: 'BCD research completed',
      researchType,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to run BCD research:', error);
    res.status(500).json({ error: 'Failed to run BCD research' });
  }
});

// Get BCD research results
router.get('/bcd-research/results', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const result = await query(
      'SELECT * FROM bcd_research ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      results: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to get BCD research results:', error);
    res.status(500).json({ error: 'Failed to get BCD research results' });
  }
});

// Get agent tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // Get agent
    const agentResult = await query('SELECT * FROM agents WHERE id = $1', [id]);
    
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const agent = agentResult.rows[0];
    
    // Get tasks for this agent
    const tasksResult = await query(
      'SELECT * FROM research_tasks WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [id, parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      agent: agent,
      tasks: tasksResult.rows,
      total: tasksResult.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to get agent tasks:', error);
    res.status(500).json({ error: 'Failed to get agent tasks' });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, status, capabilities } = req.body;
    
    const result = await query(
      'UPDATE agents SET name = COALESCE($1, name), type = COALESCE($2, type), status = COALESCE($3, status), capabilities = COALESCE($4, capabilities), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, type, status, capabilities, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    logger.info(`Updated agent: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM agents WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    logger.info(`Deleted agent: ${result.rows[0].name}`);
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

module.exports = router; 