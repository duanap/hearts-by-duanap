const fs = require('fs');
const http = require('http');
const path = require('path');
const { APP_VERSION } = require('./config');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

const COMMON_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin'
};

function withCommonHeaders(headers = {}) {
  return { ...COMMON_HEADERS, ...headers };
}

function resolvePublicFile(publicDir, requestPathname) {
  const publicRoot = path.resolve(publicDir);
  const pathname = requestPathname === '/' ? '/index.html' : requestPathname;
  const filePath = path.resolve(path.join(publicRoot, pathname));
  const relativePath = path.relative(publicRoot, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

function createStaticFileServer({ publicDir }) {
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, withCommonHeaders({
        'Content-Type': 'text/plain; charset=utf-8',
        'Allow': 'GET, HEAD'
      }));
      res.end('Method Not Allowed');
      return;
    }

    let requestUrl;

    try {
      requestUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    } catch (error) {
      res.writeHead(400, withCommonHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('Bad Request');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      res.writeHead(400, withCommonHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('Bad Request');
      return;
    }

    if (pathname === '/healthz') {
      const payload = JSON.stringify({
        ok: true,
        version: APP_VERSION,
        uptime: Math.round(process.uptime()),
        at: new Date().toISOString()
      });
      res.writeHead(200, withCommonHeaders({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }));
      if (req.method === 'HEAD') res.end();
      else res.end(payload);
      return;
    }

    const filePath = resolvePublicFile(publicDir, pathname);
    if (!filePath) {
      res.writeHead(403, withCommonHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, withCommonHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600'
      };
      res.writeHead(200, withCommonHeaders(headers));
      if (req.method === 'HEAD') res.end();
      else res.end(data);
    });
  });
}

module.exports = {
  MIME_TYPES,
  createStaticFileServer,
  resolvePublicFile,
  withCommonHeaders
};
