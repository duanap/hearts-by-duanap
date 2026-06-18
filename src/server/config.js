const path = require('path');
const packageJson = require('../../package.json');
const { readNumberEnv } = require('./env');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PORT = readNumberEnv('PORT', 3000, { min: 1, max: 65535, integer: true });
const APP_VERSION = packageJson.version || '0.0.0';

module.exports = {
  APP_VERSION,
  ROOT_DIR,
  PUBLIC_DIR,
  PORT
};
