"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgent = validateAgent;
exports.validateAgentUpdate = validateAgentUpdate;
function validateAgent(req, res, next) {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
    }
    return next();
}
function validateAgentUpdate(_req, _res, next) {
    next();
}
//# sourceMappingURL=validation.js.map