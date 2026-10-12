import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.isTest ? 'silent' : env.LOG_LEVEL,
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
  ...(env.isProduction
    ? {}
    : { transport: { target: 'pino-pretty', options: { singleLine: true } } }),
});
