# Hearts Online — Agent Guide

## What this is

Node.js + WebSocket multiplayer Hearts card game. Frontend migrated to Vite 6 + Vue 3 + TypeScript + SCSS + Pinia + PWA.

## Commands

```bash
# TypeScript check
npx vue-tsc --noEmit

# Production build
npx vite build

# Start dev server (Vite)
npm run dev

# Start production server (Node.js)
npm start
# → http://localhost:3000
```

## Architecture

```
server.js                    → entry point, wires config + static server + game
src/server/config.js         → PORT, PUBLIC_DIR (auto-detects dist/ or public/)
src/server/staticFiles.js    → plain HTTP file server (no Express)
src/server/realtimeGame.js   → all game logic, WebSocket handler (~2000 lines)
src/shared/constants.js      → SUITS, RANKS, PASS_NAMES, nicknames, avatars

src/client/
├── main.ts                  → Vue entry point
├── App.vue                  → root component
├── types.ts                 → TypeScript types + constants
├── stores/                  → Pinia stores
│   ├── game.ts              → game state (phase/players/trick/legalCards)
│   ├── room.ts              → room state (roomId/hostId/isHost)
│   └── settings.ts          → user preferences (sound/effects/landscape)
├── composables/             → composition functions
│   ├── useWebSocket.ts      → WebSocket connection
│   ├── useAudio.ts          → WebAudio API sounds
│   ├── useInteraction.ts    → emoji/tool interactions
│   ├── useKeyboardShortcuts.ts → keyboard shortcuts
│   ├── usePassAnimation.ts  → pass/collect animations
│   ├── useToast.ts          → toast notifications
│   └── useInteractionEffects.ts → interaction effects
└── components/              → 17 Vue components
    ├── GameTable.vue        → main game table
    ├── PlayerSeat.vue       → seat/avatar
    ├── PlayerHand.vue       → hand cards
    ├── Card.vue             → single card
    ├── CenterRing.vue       → center ring
    ├── RoomModal.vue        → room modal
    ├── SettingsModal.vue    → settings modal
    ├── InteractionPanel.vue → interaction panel
    ├── LastTrickPopover.vue → last trick popover
    ├── RoundTable.vue       → round table
    ├── SpecialEvent.vue     → special event display
    ├── ResultModal.vue      → result modal
    ├── ToastContainer.vue   → toast notifications
    └── InteractionEffects.vue → interaction effects

public/                      → static assets (table-bg.webp, icon.svg)
index.html                   → Vite entry HTML
vite.config.ts               → Vite + Vue + PWA config
```

## Key constraints

- **Server stays CommonJS** — `require()` on server, `<script>` tags replaced by Vite build.
- **WebSocket message limit**: 1KB max per message, 10 msgs/sec rate limit per connection.
- **Room cleanup**: controlled by env vars `ROOM_EMPTY_TTL_MS` (default 5m), `ROOM_IDLE_TTL_MS` (default 60m).
- **Chinese-language project** — UI text, comments, and user communication are in Chinese.
- **Vite 8 uses Rolldown** — `manualChunks` must be a function, not an object.

## Gotchas

- `src/shared/constants.js` is server source of truth. Client (`src/client/types.ts`) has its own copy — keep in sync.
- The service worker caches aggressively; after changes users may need to clear cache or wait for SW update.
- `realtimeGame.js` is the entire server game engine — rule validation, AI, room management, WebSocket handling all live here.
- config.js auto-detects `dist/` or `public/` — works for both dev and production.
- Static file server is hand-rolled (no Express) — path traversal protection is in `staticFiles.js`.
- Modal components use `defineAsyncComponent` for code splitting — main bundle is 35KB (gzip 15KB).
