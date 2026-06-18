# WebView APK packaging notes

## Current app shape

- Frontend entry: `public/index.html`
- Frontend assets: Svelte build output copied from `frontend/dist/` into `public/`, including `public/assets/`, `public/css/`, `public/icons/`, `public/table-bg-v1210.webp`, `public/manifest.webmanifest`, and `public/sw.js`.
- Legacy frontend script: `public/js/app.js` belonged to the pre-Svelte frontend and should not exist in the current `public/`; the archived copy lives under `public_legacy/js/app.js`.
- Backend entry: `server.js`
- Backend modules: `src/server/config.js`, `src/server/env.js`, `src/server/staticFiles.js`, `src/server/rateLimiter.js`, `src/server/realtimeGame.js`
- Runtime protocol: HTTP static files plus WebSocket on the same host.
- Health endpoint: `/healthz`

## WebView strategy

This game is not a pure static APK. Multiplayer rooms, card dealing, rule checks, scoring, reconnects, and AI takeover all run through the Node.js WebSocket server.

For an APK, the WebView should load one of these URLs:

- Production: `https://your-domain.example/`
- LAN test: `http://<server-lan-ip>:3000/`
- Local emulator test: `http://10.0.2.2:3000/`

Do not package only `public/` into a `file://` WebView unless the multiplayer server is moved to a remote endpoint and the frontend WebSocket URL is adjusted.

## Android requirements

- Enable JavaScript.
- Enable DOM storage.
- Allow WebSocket traffic to the same origin as the page.
- Add `android.permission.INTERNET`.
- If using plain HTTP during testing, allow cleartext traffic for the test host.
- Lock or prefer landscape orientation for the activity. The web app also performs an early screen-size preflight before the game connection starts.
- Keep the WebView URL fixed to the deployed server origin. Do not mix HTTP static assets with a different WebSocket origin unless the frontend is changed intentionally.
- If the APK loads local Capacitor assets, set the service URL in the room panel to the deployed HTTPS origin, for example `https://game.example.com`.

## Verification before packaging

Run:

```bash
npm run check
npm test
npm start
```

Then open:

```txt
http://localhost:3000/
```

For a phone on the same network, replace `localhost` with the server machine LAN IP.

## Release checklist

- Deploy the Node server behind HTTPS before public release.
- Confirm WebSocket upgrade works through the reverse proxy.
- Confirm `/healthz`, `/assets/`, `/css/app.css`, `/css/pass-animation.css`, `/css/table-ui.css`, `/css/mobile.css`, `/manifest.webmanifest`, `/sw.js`, `/icons/icon.svg`, and `/table-bg-v1210.webp` return 200. Do not require `/js/app.js` for the current Svelte build.
- Clear old WebView/app cache after changing `public/sw.js`.
- In the APK, use "服务端地址" in the room panel to reconnect to the BaoTa HTTPS origin if the app keeps showing "正在连接服务端".
- Test create room, join room, reconnect, AI fill, and leave room from at least two devices.
