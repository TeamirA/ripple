import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const INDEX_FILE = path.join(PUBLIC_DIR, 'index.html');

const ONE_HOUR = 60 * 60;
const ONE_WEEK = 7 * 24 * ONE_HOUR;

// Scripts and styles are not fingerprinted, so they get a short cache with background
// revalidation; images and fonts rarely change and can be cached for longer.
function setStaticCacheHeaders(res, filePath) {
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (/\.(js|css)$/.test(filePath)) {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${ONE_HOUR}, stale-while-revalidate=${ONE_WEEK}`,
    );
  } else {
    res.setHeader('Cache-Control', `public, max-age=${ONE_WEEK}`);
  }
}

export const serveStaticAssets = express.static(PUBLIC_DIR, {
  index: false,
  setHeaders: setStaticCacheHeaders,
});

/**
 * Client-side routes (/explore, /u/maya, /p/123...) all boot the same HTML shell.
 * Paths with a file extension are real asset requests and fall through to a 404.
 */
export function serveAppShell(req, res, next) {
  const isPageRequest = req.method === 'GET' && !path.extname(req.path);
  if (!isPageRequest) return next();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(INDEX_FILE);
}
