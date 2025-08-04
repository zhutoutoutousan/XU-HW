"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentEngine = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
const node_cron_1 = __importDefault(require("node-cron"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.simple(),
    transports: [new winston_1.default.transports.Console()]
});
class AgentEngine {
    constructor() {
        this._isRunning = false;
        this.performanceThreshold = 50.0;
        this.cashFlowThreshold = -1000.0;
        this.creationProbability = 0.1;
        this.destructionProbability = 0.05;
    }
    async start() {
        if (this._isRunning) {
            logger.warn('Agent engine is already running');
            return;
        }
        this._isRunning = true;
        logger.info('Starting agent engine');
        node_cron_1.default.schedule('*/5 * * * *', () => {
            this.evaluateAgents();
        });
        node_cron_1.default.schedule('0 */6 * * *', () => {
            this.optimizeNetwork();
        });
        node_cron_1.default.schedule('*/15 * * * *', () => {
            this.identifyCreationOpportunities();
        });
        logger.info('Agent engine started successfully');
    }
    async stop() {
        this._isRunning = false;
        logger.info('Agent engine stopped');
    }
    isRunning() {
        return this._isRunning;
    }
    async evaluateAgents() {
        try {
            const agents = await this.getActiveAgents();
            for (const agent of agents) {
                await this.evaluateAgent(agent);
            }
        }
        catch (error) {
            logger.error('Error evaluating agents:', error);
        }
    }
    async evaluateAgent(agent) {
        const newScore = await this.calculatePerformanceScore(agent);
        await database_1.database.query('UPDATE agents SET performance_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newScore, agent.id]);
        if (this.shouldDestroyAgent(agent, newScore)) {
            await this.destroyAgent(agent.id, 'poor_performance');
        }
        if (this.shouldCreateAgent(agent, newScore)) {
            await this.triggerAgentCreation(agent);
        }
        await redis_1.redis.publishAgentEvent({
            type: 'performance_updated',
            agent_id: agent.id,
            old_score: agent.performance_score,
            new_score: newScore
        });
    }
    async calculatePerformanceScore(agent) {
        const metrics = await database_1.database.query(`SELECT metric_name, AVG(metric_value) as avg_value
       FROM business_metrics 
       WHERE agent_id = $1 
       AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY metric_name`, [agent.id]);
        let score = agent.performance_score;
        for (const metric of metrics.rows) {
            switch (metric.metric_name) {
                case 'revenue_growth':
                    score += metric.avg_value * 0.3;
                    break;
                case 'cost_efficiency':
                    score += metric.avg_value * 0.2;
                    break;
                case 'customer_satisfaction':
                    score += metric.avg_value * 0.15;
                    break;
                case 'market_share':
                    score += metric.avg_value * 0.25;
                    break;
                case 'innovation_index':
                    score += metric.avg_value * 0.1;
                    break;
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    shouldDestroyAgent(agent, newScore) {
        return newScore < this.performanceThreshold ||
            (agent.cash_flow < this.cashFlowThreshold && Math.random() < this.destructionProbability);
    }
    shouldCreateAgent(agent, newScore) {
        return newScore > 80 && agent.cash_flow > 5000 && Math.random() < this.creationProbability;
    }
    async destroyAgent(agentId, reason) {
        try {
            await database_1.database.query(`UPDATE agents 
         SET destroyed_at = CURRENT_TIMESTAMP,
             status = 'destroyed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [agentId]);
            await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data) VALUES ($1, $2, $3)', [agentId, 'agent_destroyed', JSON.stringify({ reason, timestamp: new Date().toISOString() })]);
            await redis_1.redis.publishAgentEvent({
                type: 'agent_destroyed',
                agent_id: agentId,
                reason: reason
            });
            logger.info(`Agent ${agentId} destroyed due to ${reason}`);
        }
        catch (error) {
            logger.error('Error destroying agent:', error);
        }
    }
    async triggerAgentCreation(parentAgent) {
        try {
            const newAgentType = this.determineNewAgentType(parentAgent);
            const newAgentName = this.generateAgentName(newAgentType);
            const result = await database_1.database.query(`INSERT INTO agents (name, type, strategy, resources, performance_score, cash_flow)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                newAgentName,
                newAgentType,
                JSON.stringify(this.generateStrategy(newAgentType, parentAgent)),
                JSON.stringify(this.generateResources(newAgentType)),
                50.0,
                1000.0
            ]);
            const newAgent = result.rows[0];
            await database_1.database.query(`INSERT INTO agent_relationships (source_agent_id, target_agent_id, relationship_type, strength)
         VALUES ($1, $2, $3, $4)`, [parentAgent.id, newAgent.id, 'parent_child', 0.9]);
            await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data, triggered_by_agent_id) VALUES ($1, $2, $3, $4)', [newAgent.id, 'agent_created', JSON.stringify({ parent_agent_id: parentAgent.id, type: newAgentType }), parentAgent.id]);
            await redis_1.redis.publishAgentEvent({
                type: 'agent_created',
                agent: newAgent,
                parent_agent_id: parentAgent.id
            });
            logger.info(`New agent ${newAgent.id} created by ${parentAgent.id}`);
        }
        catch (error) {
            logger.error('Error creating new agent:', error);
        }
    }
    determineNewAgentType(parentAgent) {
        const agentTypes = ['market_agent', 'strategy_agent', 'resource_agent', 'negotiation_agent', 'performance_agent'];
        const complementaryTypes = {
            'market_agent': ['strategy_agent', 'performance_agent'],
            'strategy_agent': ['resource_agent', 'negotiation_agent'],
            'resource_agent': ['performance_agent', 'market_agent'],
            'negotiation_agent': ['strategy_agent', 'market_agent'],
            'performance_agent': ['resource_agent', 'strategy_agent']
        };
        const preferredTypes = complementaryTypes[parentAgent.type || 'market_agent'] || agentTypes;
        return preferredTypes[Math.floor(Math.random() * preferredTypes.length)] || 'market_agent';
    }
    generateAgentName(type) {
        const prefixes = {
            'market_agent': ['Market', 'Trend', 'Analysis'],
            'strategy_agent': ['Strategy', 'Optimizer', 'Planner'],
            'resource_agent': ['Resource', 'Manager', 'Allocator'],
            'negotiation_agent': ['Negotiator', 'Deal', 'Broker'],
            'performance_agent': ['Performance', 'Monitor', 'Tracker']
        };
        const suffix = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
        const prefix = prefixes[type || 'market_agent'] || ['Agent'];
        return `${prefix[Math.floor(Math.random() * prefix.length)]} ${suffix[Math.floor(Math.random() * suffix.length)]}`;
    }
    generateStrategy(type, _parentAgent) {
        const baseStrategy = {
            risk_tolerance: 'medium',
            focus: 'efficiency',
            adaptation_rate: 0.1
        };
        switch (type) {
            case 'market_agent':
                return { ...baseStrategy, strategy: 'trend_analysis', market_focus: 'global' };
            case 'strategy_agent':
                return { ...baseStrategy, strategy: 'resource_optimization', optimization_target: 'cost' };
            case 'resource_agent':
                return { ...baseStrategy, strategy: 'cost_reduction', allocation_method: 'dynamic' };
            case 'negotiation_agent':
                return { ...baseStrategy, strategy: 'win_win', style: 'collaborative' };
            case 'performance_agent':
                return { ...baseStrategy, strategy: 'continuous_monitoring', threshold: 'high' };
            default:
                return baseStrategy;
        }
    }
    generateResources(_type) {
        return {
            computational_power: Math.random() * 100,
            memory_allocation: Math.random() * 1000,
            network_bandwidth: Math.random() * 100,
            specialized_tools: []
        };
    }
    async optimizeNetwork() {
        try {
            const networkMetrics = await this.analyzeNetworkTopology();
            await this.optimizeRelationships(networkMetrics);
            await this.rebalanceResources(networkMetrics);
            logger.info('Network optimization completed');
        }
        catch (error) {
            logger.error('Error optimizing network:', error);
        }
    }
    async analyzeNetworkTopology() {
        const result = await database_1.database.query(`
      SELECT 
        COUNT(*) as total_agents,
        AVG(performance_score) as avg_performance,
        SUM(cash_flow) as total_cash_flow,
        COUNT(CASE WHEN performance_score < 50 THEN 1 END) as underperforming_agents
      FROM agents 
      WHERE destroyed_at IS NULL
    `);
        return result.rows[0];
    }
    async optimizeRelationships(_networkMetrics) {
        const relationships = await database_1.database.query(`
      SELECT ar.*, 
             source.performance_score as source_score,
             target.performance_score as target_score
      FROM agent_relationships ar
      JOIN agents source ON ar.source_agent_id = source.id
      JOIN agents target ON ar.target_agent_id = target.id
      WHERE source.destroyed_at IS NULL AND target.destroyed_at IS NULL
    `);
        for (const rel of relationships.rows) {
            const avgScore = (rel.source_score + rel.target_score) / 2;
            const newStrength = Math.min(1.0, rel.strength + (avgScore / 100) * 0.1);
            if (newStrength !== rel.strength) {
                await database_1.database.query('UPDATE agent_relationships SET strength = $1 WHERE id = $2', [newStrength, rel.id]);
            }
        }
    }
    async rebalanceResources(_networkMetrics) {
        const agents = await this.getActiveAgents();
        for (const agent of agents) {
            if (agent.performance_score > 80) {
                await database_1.database.query('UPDATE agents SET resources = jsonb_set(resources, \'{computational_power}\', \'100\') WHERE id = $1', [agent.id]);
            }
            else if (agent.performance_score < 30) {
                await database_1.database.query('UPDATE agents SET resources = jsonb_set(resources, \'{computational_power}\', \'20\') WHERE id = $1', [agent.id]);
            }
        }
    }
    async identifyCreationOpportunities() {
        try {
            const marketGaps = await this.analyzeMarketGaps();
            for (const gap of marketGaps) {
                if (Math.random() < 0.3) {
                    await this.createAgentForGap(gap);
                }
            }
        }
        catch (error) {
            logger.error('Error identifying creation opportunities:', error);
        }
    }
    async analyzeMarketGaps() {
        const typeDistribution = await database_1.database.query(`
      SELECT type, COUNT(*) as count
      FROM agents 
      WHERE destroyed_at IS NULL
      GROUP BY type
    `);
        const gaps = [];
        const totalAgents = typeDistribution.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        for (const row of typeDistribution.rows) {
            const percentage = (parseInt(row.count) / totalAgents) * 100;
            if (percentage < 15) {
                gaps.push({ type: row.type, current_percentage: percentage });
            }
        }
        return gaps;
    }
    async createAgentForGap(gap) {
        const agentName = this.generateAgentName(gap.type);
        const strategy = this.generateStrategy(gap.type, { type: gap.type });
        const resources = this.generateResources(gap.type);
        const result = await database_1.database.query(`INSERT INTO agents (name, type, strategy, resources, performance_score, cash_flow)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [agentName, gap.type, JSON.stringify(strategy), JSON.stringify(resources), 60.0, 2000.0]);
        const newAgent = result.rows[0];
        await database_1.database.query('INSERT INTO agent_events (agent_id, event_type, event_data) VALUES ($1, $2, $3)', [newAgent.id, 'agent_created', JSON.stringify({ reason: 'market_gap_fill', gap_type: gap.type })]);
        await redis_1.redis.publishAgentEvent({
            type: 'agent_created',
            agent: newAgent,
            reason: 'market_gap_fill'
        });
        logger.info(`Created agent ${newAgent.id} to fill market gap in ${gap.type}`);
    }
    async getActiveAgents() {
        const result = await database_1.database.query('SELECT * FROM agents WHERE destroyed_at IS NULL ORDER BY performance_score DESC');
        return result.rows;
    }
    async triggerNegotiation(negotiation) {
        try {
            const n8nUrl = process.env['N8N_WEBHOOK_URL'] || 'http://localhost:5678/webhook/negotiation';
            await axios_1.default.post(n8nUrl, {
                negotiation_id: negotiation.id,
                initiator_agent_id: negotiation.initiator_agent_id,
                target_agent_id: negotiation.target_agent_id,
                negotiation_type: negotiation.negotiation_type,
                terms: negotiation.terms
            });
            logger.info(`Negotiation ${negotiation.id} triggered in n8n`);
        }
        catch (error) {
            logger.error('Error triggering negotiation:', error);
        }
    }
}
exports.agentEngine = new AgentEngine();
//# sourceMappingURL=agentEngine.js.map