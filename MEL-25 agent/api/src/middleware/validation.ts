import { Request, Response, NextFunction } from 'express';

export function validateAgent(req: Request, res: Response, next: NextFunction) {
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
    }
    return next();
}

export function validateAgentUpdate(_req: Request, _res: Response, next: NextFunction) {
    next();
}
