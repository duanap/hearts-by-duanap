# Hearts Online — Agent Guide

## What this is

Node.js + WebSocket multiplayer Hearts card game. Single-page app, no build step, no bundler, no TypeScript. Vanilla JS throughout.

## Commands

```bash
# Syntax-check all key JS files (no test suite exists)
npm run check

# Start dev server
npm start
# → http://localhost:3000
```

No lint, no typecheck, no test framework. `npm run check` runs `node --check` on the 6 key JS files.

## Architecture

```
server.js                    → entry point, wires config + static server + game
src/server/config.js         → PORT, PUBLIC_DIR
src/server/staticFiles.js    → plain HTTP file server (no Express)
src/server/realtimeGame.js   → all game logic, WebSocket handler (~2000 lines)
src/shared/constants.js      → SUITS, RANKS, PASS_NAMES, nicknames, avatars
public/js/app.js             → entire client (~3250 lines, single file)
public/css/app.css           → all styles (~6700 lines, single file)
public/sw.js                 → PWA service worker (cache-first strategy)
public/index.html            → single HTML page
```

## Critical: shared constants duplication

`src/shared/constants.js` is the server source of truth. The client (`public/js/app.js`) has its own inline copy with a sync comment at line 1. **When changing constants (SUITS, nicknames, etc.), you must update BOTH files.** They will silently drift and cause bugs.

## Version numbers

Version appears in **4 places** that must stay in sync:
1. `package.json` → `"version"`
2. `public/index.html` → `<title>` and `.brand-version`
3. `public/sw.js` → `CACHE_NAME` string
4. `README.md` → changelog header

## Key constraints

- **No build step** — all JS is served raw. Use `require()` on server, plain `<script>` on client.
- **WebSocket message limit**: 1KB max per message, 10 msgs/sec rate limit per connection.
- **Room cleanup**: controlled by env vars `ROOM_EMPTY_TTL_MS` (default 5m), `ROOM_IDLE_TTL_MS` (default 60m).
- **Chinese-language project** — UI text, comments, and user communication are in Chinese.

## Gotchas

- `app.js` duplicates constants from `constants.js` — the sync comment is easy to miss.
- The service worker caches aggressively; after changes users may need to clear cache or wait for SW update.
- `realtimeGame.js` is the entire server game engine — rule validation, AI, room management, WebSocket handling all live here. No tests cover it.
- PWA manifest at `public/manifest.webmanifest` — update icons/SW cache name together.
- Static file server is hand-rolled (no Express) — path traversal protection is in `staticFiles.js`.
