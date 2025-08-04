const express = require('express');
const router = express.Router();
const { query } = require('../services/database');
const logger = require('../utils/logger');

// Get all workflows
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM workflows ORDER BY created_at DESC');
    res.json({
      workflows: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Failed to get workflows:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
});

// Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM workflows WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get workflow:', error);
    res.status(500).json({ error: 'Failed to get workflow' });
  }
});

// Create new workflow
router.post('/', async (req, res) => {
  try {
    const { name, n8n_workflow_id, config } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await query(
      'INSERT INTO workflows (name, n8n_workflow_id, config) VALUES ($1, $2, $3) RETURNING *',
      [name, n8n_workflow_id, config]
    );
    
    logger.info(`Created new workflow: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to create workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, n8n_workflow_id, status, config } = req.body;
    
    const result = await query(
      'UPDATE workflows SET name = COALESCE($1, name), n8n_workflow_id = COALESCE($2, n8n_workflow_id), status = COALESCE($3, status), config = COALESCE($4, config) WHERE id = $5 RETURNING *',
      [name, n8n_workflow_id, status, config, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    logger.info(`Updated workflow: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM workflows WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    logger.info(`Deleted workflow: ${result.rows[0].name}`);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Trigger workflow
router.post('/:id/trigger', async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    // Get workflow
    const workflowResult = await query('SELECT * FROM workflows WHERE id = $1', [id]);
    
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const workflow = workflowResult.rows[0];
    
    // Here you would trigger the n8n workflow
    // For now, we'll just log the trigger
    logger.info(`Triggering workflow: ${workflow.name}`, { data });
    
    res.json({
      message: 'Workflow triggered',
      workflow: workflow.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to trigger workflow:', error);
    res.status(500).json({ error: 'Failed to trigger workflow' });
  }
});

module.exports = router; 