const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(ROOT_DIR, 'public');
const PORT = Number(process.env.PORT || 3000);

module.exports = {
  ROOT_DIR,
  DIST_DIR,
  PUBLIC_DIR,
  PORT
};
