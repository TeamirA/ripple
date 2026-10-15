import { Router } from 'express';
import { issueCsrfToken, verifyCsrfToken } from './middlewares/csrfProtection.js';
import { authenticate } from './middlewares/requireAuth.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { usersRouter } from './modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);

apiRouter.use(issueCsrfToken, verifyCsrfToken, authenticate);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
