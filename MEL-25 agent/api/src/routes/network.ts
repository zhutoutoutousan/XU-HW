import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/relationships', async (_req, res) => {
    try {
        const result = await database.query(
            'SELECT * FROM agent_relationships WHERE source_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL) AND target_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL)'
        );
        res.json({ relationships: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch relationships' });
    }
});

export { router as networkRoutes };
