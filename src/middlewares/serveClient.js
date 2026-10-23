import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
// Named app.html (not index.html) so a CDN serving /index.html for "/" can never bypass
// the server, which is where the security headers on documents are set.
const APP_SHELL_FILE = path.join(PUBLIC_DIR, 'app.html');

const ONE_HOUR = 60 * 60;
const ONE_WEEK = 7 * 24 * ONE_HOUR;

// Scripts and styles are ES modules without content hashes, so browsers revalidate them
// (cheap 304s via ETag) and never mix files from two deploys; shared caches such as a CDN
// may keep them for an hour. Images and fonts rarely change and are cached for a week.
function setStaticCacheHeaders(res, filePath) {
  if (!env.isProduction || /\.(html|js|css)$/.test(filePath)) {
    const sharedCache = env.isProduction ? `, s-maxage=${ONE_HOUR}` : '';
    res.setHeader('Cache-Control', `public, no-cache${sharedCache}`);
  } else {
    res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK}`);
  }
}

export const serveStaticAssets = express.static(PUBLIC_DIR, {
  index: false,
  setHeaders: setStaticCacheHeaders,
});

/**
 * Client-side routes (/, /explore, /u/maya, /p/123...) all boot the same HTML shell.
 * Paths with a file extension are real asset requests and fall through to a 404.
 */
export function serveAppShell(req, res, next) {
  const isPageRequest = ['GET', 'HEAD'].includes(req.method) && !path.extname(req.path);
  if (!isPageRequest) return next();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(APP_SHELL_FILE);
}
