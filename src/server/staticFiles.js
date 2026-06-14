const fs = require('fs');
const http = require('http');
const path = require('path');
const { SUITS, PASS_NAMES, HUMAN_NICKNAMES } = require('../shared/constants');

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
    let requestUrl;

    try {
      requestUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    // Dynamic route: /js/constants.js ? single source of truth for shared constants
    if (pathname === '/js/constants.js') {
      const js = '// Auto-generated from src/shared/constants.js\n' +
        'const SUITS = ' + JSON.stringify(SUITS) + ';\n' +
        'const PASS_NAMES = ' + JSON.stringify(PASS_NAMES) + ';\n' +
        'const ROMANCE_NAMES = ' + JSON.stringify(HUMAN_NICKNAMES) + ';\n';
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(js);
      return;
    }

    const filePath = resolvePublicFile(publicDir, pathname);
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

module.exports = {
  MIME_TYPES,
  createStaticFileServer,
  resolvePublicFile
};
