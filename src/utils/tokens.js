import { randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const JWT_ALGORITHM = 'HS256';

/** Signs a session token. `version` ties it to the user's current tokenVersion. */
export function signSessionToken({ userId, tokenVersion }) {
  return jwt.sign({ ver: tokenVersion }, env.JWT_SECRET, {
    subject: userId,
    algorithm: JWT_ALGORITHM,
    expiresIn: `${env.JWT_EXPIRES_IN_DAYS}d`,
  });
}

/** Returns `{ userId, tokenVersion }` or null when the token is missing, invalid or expired. */
export function verifySessionToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    return { userId: payload.sub, tokenVersion: payload.ver };
  } catch {
    return null;
  }
}

export function generateCsrfToken() {
  return randomBytes(32).toString('base64url');
}

export function areTokensEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
