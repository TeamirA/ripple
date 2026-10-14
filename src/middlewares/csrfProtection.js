import { AppError } from '../utils/AppError.js';
import { CSRF_COOKIE, CSRF_HEADER, setCsrfCookie } from '../utils/cookies.js';
import { areTokensEqual, generateCsrfToken } from '../utils/tokens.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Makes sure every client has a CSRF cookie to echo back (double-submit pattern). */
export function issueCsrfToken(req, res, next) {
  if (!req.cookies[CSRF_COOKIE]) {
    const token = generateCsrfToken();
    req.cookies[CSRF_COOKIE] = token;
    setCsrfCookie(res, token);
  }
  next();
}

/**
 * Rejects state-changing requests unless the X-CSRF-Token header matches the
 * CSRF cookie. A cross-site page can make the browser send cookies, but it
 * cannot read them to forge the header.
 */
export function verifyCsrfToken(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const isValid = areTokensEqual(req.get(CSRF_HEADER), req.cookies[CSRF_COOKIE]);
  next(isValid ? undefined : AppError.forbidden('Invalid or missing CSRF token'));
}
