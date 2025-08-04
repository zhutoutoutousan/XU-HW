"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
exports.metricsRoutes = router;
router.get('/', async (_req, res) => {
    try {
        const result = await database_1.database.query('SELECT * FROM business_metrics ORDER BY created_at DESC LIMIT 100');
        res.json({ metrics: result.rows });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
//# sourceMappingURL=metrics.js.map