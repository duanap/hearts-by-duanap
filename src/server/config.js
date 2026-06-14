const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PORT = Number(process.env.PORT || 3000);

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  PORT
};
