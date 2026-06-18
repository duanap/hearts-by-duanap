const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function exists(file) {
  return fs.existsSync(path.join(ROOT_DIR, file));
}

function read(file) {
  return fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
}

function checkJsSyntax(file) {
  const absolute = path.join(ROOT_DIR, file);
  if (!fs.existsSync(absolute)) {
    fail(`Missing JS file: ${file}`);
    return;
  }

  const result = spawnSync(process.execPath, ['--check', absolute], {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    fail(`Syntax check failed: ${file}\n${result.stderr || result.stdout}`);
  }
}

const html = exists('public/index.html') ? read('public/index.html') : '';
const hasLegacyApp = exists('public/js/app.js');
const hasSvelteAsset = /src="\/assets\/[^"]+\.js"/.test(html);
const isSveltePublic = !hasLegacyApp && hasSvelteAsset;

const jsFiles = [
  'server.js',
  'src/server/config.js',
  'src/server/env.js',
  'src/server/staticFiles.js',
  'src/server/rateLimiter.js',
  'src/server/realtimeGame.js',
  'public/sw.js',
  'scripts/browser-check.js',
  'scripts/check.js',
  'scripts/smoke-test.js'
];

if (hasLegacyApp) jsFiles.push('public/js/app.js');

for (const file of jsFiles) checkJsSyntax(file);

for (const file of ['package.json', 'public/manifest.webmanifest']) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    fail(`JSON parse failed: ${file}: ${error.message}`);
  }
}

if (exists('package-lock.json')) {
  try {
    JSON.parse(read('package-lock.json'));
  } catch (error) {
    fail(`JSON parse failed: package-lock.json: ${error.message}`);
  }
}

const requiredPublicFiles = [
  'public/index.html',
  'public/css/app.css',
  'public/css/pass-animation.css',
  'public/css/table-ui.css',
  'public/css/mobile.css',
  'public/sw.js',
  'public/manifest.webmanifest',
  'public/icons/icon.svg',
  'public/table-bg-v1210.webp'
];

if (hasLegacyApp) requiredPublicFiles.push('public/js/app.js');
if (isSveltePublic) requiredPublicFiles.push('public/assets');

for (const file of requiredPublicFiles) {
  if (!exists(file)) fail(`Missing public asset: ${file}`);
}

for (const href of ['/css/app.css', '/css/pass-animation.css', '/css/table-ui.css', '/css/mobile.css']) {
  if (!html.includes(`href="${href}"`)) fail(`Missing stylesheet link in index.html: ${href}`);
}

if (!html.includes('screen-mobile-preflight')) fail('Missing early screen preflight script in index.html');
if (html.includes('serverConnectPanel')) fail('Server connection panel should not be rendered in index.html');
if (html.includes('serverFixedOrigin') || html.includes('serverUrlInput') || html.includes('saveServerUrlBtn')) {
  fail('Fixed server URL or server input is still rendered in index.html');
}

if (hasLegacyApp) {
  if (!html.includes('src="/js/app.js"')) fail('Missing app.js script in index.html');
  if (!html.includes('v1.4.22')) fail('index.html version is not v1.4.22');
  if (!html.includes('roomStatus')) fail('Missing room status in index.html');
  if (!html.includes('connectionModal')) fail('Missing connection modal in index.html');
}

if (isSveltePublic) {
  if (!html.includes('Hearts by duanap Svelte')) fail('Svelte public index title is missing');
  if (html.includes('/js/app.js')) fail('Svelte public index still references legacy app.js');
}

if (!hasLegacyApp && !isSveltePublic) fail('Missing frontend entry script in index.html');

const sw = read('public/sw.js');
const swAssets = [
  '/',
  '/index.html',
  '/css/app.css',
  '/css/pass-animation.css',
  '/css/table-ui.css',
  '/css/mobile.css',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/table-bg-v1210.webp'
];

if (hasLegacyApp) swAssets.push('/js/app.js');

for (const asset of swAssets) {
  if (!sw.includes(`'${asset}'`)) fail(`Missing Service Worker cache entry: ${asset}`);
}

if (hasLegacyApp && !sw.includes('hearts-online-v1.4.22-room-status-actions')) fail('Service Worker cache name is not v1.4.22');
if (isSveltePublic && !sw.includes('hearts-online-svelte-v1.4.22')) fail('Svelte Service Worker cache name is not v1.4.22');

if (process.exitCode) process.exit(process.exitCode);
console.log('check ok');
