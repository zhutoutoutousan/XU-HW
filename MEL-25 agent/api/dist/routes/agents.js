"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const agentEngine_1 = require("../services/agentEngine");
const validation_1 = require("../middleware/validation");
const winston_1 = __importDefault(require("winston"));
const router = (0, express_1.Router)();
exports.agentRoutes = router;
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.simple(),
    transports: [new winston_1.default.transports.Console()]
});
router.get('/', async (req, res) => {
    try {
        const { type, status, limit = 50, offset = 0 } = req.query;
        let query = 'SELECT * FROM agents WHERE destroyed_at IS NULL';
        const params = [];
        if (type) {
            query += ' AND type = $1';
            params.push(type);
        }
        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }
        query += ' ORDER BY performance_score DESC, created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);
        const result = await database_1.database.query(query, params);
        await redis_1.redis.cacheAgentData('list', result.rows, 300);
        res.json({
            agents: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        logger.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cached = await redis_1.redis.getAgentData(id);
        if (cached) {
            return res.json(cached);
        }
        const result = await database_1.database.query('SELECT * FROM agents WHERE id = $1 AND destroyed_at IS NULL', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const agent = result.rows[0];
        await redis_1.redis.cacheAgentData(id || '', agent);
        return res.json(agent);
    }
    catch (error) {
        logger.error('Error fetching agent:', error);
        return res.status(500).json({ error: 'Failed to fetch agent' });
    }
});
router.post('/', validation_1.validateAgent, async (req, res) => {
    try {
        const { name, type, strategy, resources } = req.body;
        const result = await database_1.database.query(`INSERT INTO agents (name, type, strategy, resources, performance_score, cash_flow)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [name, type, strategy || '{}', resources || '{}', 0.0, 0.0]);
        const newAgent = result.rows[0];
        await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data) VALUES ($1, $2, $3)', [newAgent.id, 'agent_created', JSON.stringify({ name, type, strategy })]);
        await redis_1.redis.publishAgentEvent({
            type: 'agent_created',
            agent: newAgent
        });
        await redis_1.redis.cacheAgentData(newAgent.id, newAgent);
        res.status(201).json(newAgent);
    }
    catch (error) {
        logger.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});
router.put('/:id', validation_1.validateAgentUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, strategy, resources, performance_score, cash_flow } = req.body;
        const result = await database_1.database.query(`UPDATE agents 
       SET name = COALESCE($1, name),
           strategy = COALESCE($2, strategy),
           resources = COALESCE($3, resources),
           performance_score = COALESCE($4, performance_score),
           cash_flow = COALESCE($5, cash_flow),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND destroyed_at IS NULL
       RETURNING *`, [name, strategy, resources, performance_score, cash_flow, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const updatedAgent = result.rows[0];
        await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data) VALUES ($1, $2, $3)', [id, 'agent_updated', JSON.stringify(req.body)]);
        await redis_1.redis.publishAgentEvent({
            type: 'agent_updated',
            agent: updatedAgent
        });
        await redis_1.redis.cacheAgentData(id || '', updatedAgent);
        return res.json(updatedAgent);
    }
    catch (error) {
        logger.error('Error updating agent:', error);
        return res.status(500).json({ error: 'Failed to update agent' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.database.query(`UPDATE agents 
       SET destroyed_at = CURRENT_TIMESTAMP,
           status = 'destroyed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND destroyed_at IS NULL
       RETURNING *`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        const destroyedAgent = result.rows[0];
        await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data) VALUES ($1, $2, $3)', [id, 'agent_destroyed', JSON.stringify({ reason: 'manual_destruction' })]);
        await redis_1.redis.publishAgentEvent({
            type: 'agent_destroyed',
            agent: destroyedAgent
        });
        await redis_1.redis.del(`agent:${id}`);
        return res.json({ message: 'Agent destroyed successfully', agent: destroyedAgent });
    }
    catch (error) {
        logger.error('Error destroying agent:', error);
        return res.status(500).json({ error: 'Failed to destroy agent' });
    }
});
router.get('/:id/relationships', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.database.query(`SELECT ar.*, 
              source.name as source_name, source.type as source_type,
              target.name as target_name, target.type as target_type
       FROM agent_relationships ar
       JOIN agents source ON ar.source_agent_id = source.id
       JOIN agents target ON ar.target_agent_id = target.id
       WHERE (ar.source_agent_id = $1 OR ar.target_agent_id = $1)
       AND source.destroyed_at IS NULL AND target.destroyed_at IS NULL`, [id]);
        res.json({
            relationships: result.rows,
            total: result.rows.length
        });
    }
    catch (error) {
        logger.error('Error fetching agent relationships:', error);
        res.status(500).json({ error: 'Failed to fetch agent relationships' });
    }
});
router.get('/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const result = await database_1.database.query(`SELECT * FROM agent_transactions 
       WHERE from_agent_id = $1 OR to_agent_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [id, limit, offset]);
        res.json({
            transactions: result.rows,
            total: result.rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        logger.error('Error fetching agent transactions:', error);
        res.status(500).json({ error: 'Failed to fetch agent transactions' });
    }
});
router.get('/:id/metrics', async (req, res) => {
    try {
        const { id } = req.params;
        const { period = '30d' } = req.query;
        let dateFilter = '';
        if (period === '7d') {
            dateFilter = 'AND created_at >= NOW() - INTERVAL \'7 days\'';
        }
        else if (period === '30d') {
            dateFilter = 'AND created_at >= NOW() - INTERVAL \'30 days\'';
        }
        else if (period === '90d') {
            dateFilter = 'AND created_at >= NOW() - INTERVAL \'90 days\'';
        }
        const result = await database_1.database.query(`SELECT metric_name, 
              AVG(metric_value) as avg_value,
              MAX(metric_value) as max_value,
              MIN(metric_value) as min_value,
              COUNT(*) as data_points
       FROM business_metrics 
       WHERE agent_id = $1 ${dateFilter}
       GROUP BY metric_name
       ORDER BY metric_name`, [id]);
        res.json({
            metrics: result.rows,
            period: period
        });
    }
    catch (error) {
        logger.error('Error fetching agent metrics:', error);
        res.status(500).json({ error: 'Failed to fetch agent metrics' });
    }
});
router.post('/:id/negotiate', async (req, res) => {
    try {
        const { id } = req.params;
        const { target_agent_id, negotiation_type, terms } = req.body;
        const targetAgent = await database_1.database.query('SELECT * FROM agents WHERE id = $1 AND destroyed_at IS NULL', [target_agent_id]);
        if (targetAgent.rows.length === 0) {
            return res.status(404).json({ error: 'Target agent not found' });
        }
        const negotiation = await database_1.database.query(`INSERT INTO agent_negotiations (initiator_agent_id, target_agent_id, negotiation_type, terms)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [id, target_agent_id, negotiation_type, terms || '{}']);
        await agentEngine_1.agentEngine.triggerNegotiation(negotiation.rows[0]);
        return res.json({
            message: 'Negotiation initiated',
            negotiation: negotiation.rows[0]
        });
    }
    catch (error) {
        logger.error('Error initiating negotiation:', error);
        return res.status(500).json({ error: 'Failed to initiate negotiation' });
    }
});
//# sourceMappingURL=agents.js.map