import { Router } from 'express';
import { pingDatabase } from './health.repository.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', database: 'up', uptime: Math.round(process.uptime()) });
  } catch (err) {
    req.log.error({ err }, 'Database health check failed');
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});
