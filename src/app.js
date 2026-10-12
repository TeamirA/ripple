import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { apiRouter } from './routes.js';

const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: env.isProduction ? [] : null,
  },
};

/** Same-origin requests carry no Origin header; cross-origin ones must be allow-listed. */
function isOriginAllowed(origin) {
  return !origin || env.CORS_ORIGINS.includes(origin);
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url.startsWith('/api/v1/health') },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(helmet({ contentSecurityPolicy }));
  app.use(
    cors({
      origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/v1', apiRouter);
  app.use('/api', notFound);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
