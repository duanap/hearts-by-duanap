const logger = require('./src/server/logger');
const { PORT, PUBLIC_DIR } = require('./src/server/config');
const { createStaticFileServer } = require('./src/server/staticFiles');
const { attachRealtimeGame } = require('./src/server/realtimeGame');

const server = createStaticFileServer({ publicDir: PUBLIC_DIR });
const gameServer = attachRealtimeGame(server);

server.listen(PORT, () => {
  const { timing } = gameServer;
  logger.info(`Hearts server started: http://localhost:${PORT}`);
  logger.info(`Room IDs: 4 digits; offline after ${Math.ceil(timing.DISCONNECT_GRACE_MS / 1000)}s; AI takeover after ${Math.ceil(timing.OFFLINE_TAKEOVER_MS / 60000)}m; empty rooms close after ${Math.ceil(timing.ROOM_EMPTY_TTL_MS / 60000)}m; idle rooms close after ${Math.ceil(timing.ROOM_IDLE_TTL_MS / 60000)}m.`);
});
