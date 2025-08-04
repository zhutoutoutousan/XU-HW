"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
exports.networkRoutes = router;
router.get('/relationships', async (_req, res) => {
    try {
        const result = await database_1.database.query('SELECT * FROM agent_relationships WHERE source_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL) AND target_agent_id IN (SELECT id FROM agents WHERE destroyed_at IS NULL)');
        res.json({ relationships: result.rows });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch relationships' });
    }
});
//# sourceMappingURL=network.js.map