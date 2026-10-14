import { findAuthUserById } from '../modules/users/users.repository.js';
import { AppError } from '../utils/AppError.js';
import { SESSION_COOKIE, clearSessionCookie } from '../utils/cookies.js';
import { verifySessionToken } from '../utils/tokens.js';

/**
 * Attaches `req.user` ({ id, username }) when a valid session cookie is present.
 * Never fails the request: public endpoints still work for anonymous visitors.
 */
export async function authenticate(req, res, next) {
  const session = verifySessionToken(req.cookies[SESSION_COOKIE]);
  if (!session) return next();

  const user = await findAuthUserById(session.userId);
  if (!user || user.tokenVersion !== session.tokenVersion) {
    clearSessionCookie(res);
    return next();
  }

  req.user = { id: user.id, username: user.username };
  next();
}

export function requireAuth(req, _res, next) {
  next(req.user ? undefined : AppError.unauthorized());
}
