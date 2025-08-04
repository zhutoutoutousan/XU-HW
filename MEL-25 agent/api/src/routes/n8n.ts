import { Router } from 'express';

const router = Router();

router.post('/webhook/negotiation', async (req, res) => {
    try {
        // Handle n8n webhook for negotiations
        console.log('Negotiation webhook received:', req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process negotiation' });
    }
});

export { router as n8nRoutes };
