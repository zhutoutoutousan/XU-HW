const express = require('express');
const router = express.Router();
const { query } = require('../services/database');
const { cacheResearchData, getResearchData } = require('../services/redis');
const logger = require('../utils/logger');

// Get all research data
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, content_type } = req.query;
    
    let sql = 'SELECT * FROM bcd_research';
    let params = [];
    
    if (content_type) {
      sql += ' WHERE content_type = $1';
      params.push(content_type);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      research: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to get research data:', error);
    res.status(500).json({ error: 'Failed to get research data' });
  }
});

// Get research by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM bcd_research WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Research not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get research:', error);
    res.status(500).json({ error: 'Failed to get research' });
  }
});

// Get research by content type
router.get('/type/:contentType', async (req, res) => {
  try {
    const { contentType } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const result = await query(
      'SELECT * FROM bcd_research WHERE content_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [contentType, parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      research: result.rows,
      content_type: contentType,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to get research by type:', error);
    res.status(500).json({ error: 'Failed to get research by type' });
  }
});

// Get cached research data
router.get('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await getResearchData(key);
    
    if (!data) {
      return res.status(404).json({ error: 'Cached data not found' });
    }
    
    res.json({
      key,
      data,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get cached research data:', error);
    res.status(500).json({ error: 'Failed to get cached research data' });
  }
});

// Create new research entry
router.post('/', async (req, res) => {
  try {
    const { source_url, content_type, raw_data, processed_data } = req.body;
    
    if (!content_type) {
      return res.status(400).json({ error: 'Content type is required' });
    }
    
    const result = await query(
      'INSERT INTO bcd_research (source_url, content_type, raw_data, processed_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [source_url, content_type, raw_data, processed_data]
    );
    
    // Cache the result
    if (source_url) {
      await cacheResearchData(source_url, result.rows[0]);
    }
    
    logger.info(`Created new research entry: ${content_type}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to create research entry:', error);
    res.status(500).json({ error: 'Failed to create research entry' });
  }
});

// Update research entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source_url, content_type, raw_data, processed_data, analysis_results } = req.body;
    
    const result = await query(
      'UPDATE bcd_research SET source_url = COALESCE($1, source_url), content_type = COALESCE($2, content_type), raw_data = COALESCE($3, raw_data), processed_data = COALESCE($4, processed_data), analysis_results = COALESCE($5, analysis_results) WHERE id = $6 RETURNING *',
      [source_url, content_type, raw_data, processed_data, analysis_results, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Research not found' });
    }
    
    // Update cache
    if (source_url) {
      await cacheResearchData(source_url, result.rows[0]);
    }
    
    logger.info(`Updated research entry: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update research entry:', error);
    res.status(500).json({ error: 'Failed to update research entry' });
  }
});

// Delete research entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM bcd_research WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Research not found' });
    }
    
    logger.info(`Deleted research entry: ${id}`);
    res.json({ message: 'Research entry deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete research entry:', error);
    res.status(500).json({ error: 'Failed to delete research entry' });
  }
});

// Get research statistics
router.get('/stats/summary', async (req, res) => {
  try {
    // Get total count
    const totalResult = await query('SELECT COUNT(*) as total FROM bcd_research');
    
    // Get count by content type
    const typeResult = await query(
      'SELECT content_type, COUNT(*) as count FROM bcd_research GROUP BY content_type ORDER BY count DESC'
    );
    
    // Get recent activity
    const recentResult = await query(
      'SELECT content_type, created_at FROM bcd_research ORDER BY created_at DESC LIMIT 10'
    );
    
    res.json({
      total: parseInt(totalResult.rows[0].total),
      by_type: typeResult.rows,
      recent_activity: recentResult.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get research statistics:', error);
    res.status(500).json({ error: 'Failed to get research statistics' });
  }
});

// Search research data
router.get('/search', async (req, res) => {
  try {
    const { q, content_type, limit = 20, offset = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let sql = 'SELECT * FROM bcd_research WHERE (raw_data::text ILIKE $1 OR processed_data::text ILIKE $1)';
    let params = [`%${q}%`];
    
    if (content_type) {
      sql += ' AND content_type = $2';
      params.push(content_type);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      query: q,
      results: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to search research data:', error);
    res.status(500).json({ error: 'Failed to search research data' });
  }
});

module.exports = router; 