import { Router } from 'express';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import * as authController from './auth.controller.js';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.get('/csrf', authController.getCsrfToken);
authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register,
);
authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login,
);
authRouter.post('/demo', authRateLimiter, authController.loginDemo);
authRouter.post('/logout', authController.logout);
authRouter.get('/session', authController.getSession);
authRouter.get('/me', requireAuth, authController.getMe);
authRouter.patch(
  '/password',
  requireAuth,
  authRateLimiter,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword,
);
