import { env } from '../config/env.js';

export const SESSION_COOKIE = 'ripple_session';
export const CSRF_COOKIE = 'ripple_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const DAY_MS = 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  secure: env.isProduction,
  path: '/',
};

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    ...baseCookieOptions,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: env.JWT_EXPIRES_IN_DAYS * DAY_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { ...baseCookieOptions, httpOnly: true, sameSite: 'lax' });
}

/** Readable by the frontend so it can echo the value back in the CSRF header. */
export function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE, token, { ...baseCookieOptions, httpOnly: false, sameSite: 'strict' });
}
