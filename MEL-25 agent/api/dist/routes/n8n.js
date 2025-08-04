"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.n8nRoutes = router;
router.post('/webhook/negotiation', async (req, res) => {
    try {
        console.log('Negotiation webhook received:', req.body);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to process negotiation' });
    }
});
//# sourceMappingURL=n8n.js.map