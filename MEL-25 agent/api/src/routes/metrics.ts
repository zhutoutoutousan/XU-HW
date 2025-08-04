import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/', async (_req, res) => {
    try {
        const result = await database.query('SELECT * FROM business_metrics ORDER BY created_at DESC LIMIT 100');
        res.json({ metrics: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

export { router as metricsRoutes };
