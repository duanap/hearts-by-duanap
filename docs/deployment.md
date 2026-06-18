# Deployment notes

## Runtime

This project is a Node.js app that serves static files and the WebSocket game server from the same origin.

```bash
npm install --omit=dev
npm start
```

Health check:

```txt
http://127.0.0.1:3000/healthz
```

## PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

Copy `.env.example` to your deployment environment and set `PORT`, room cleanup timings, reconnect timings, WebSocket message limits, and WebSocket security settings as needed.

For public deployment, set `WS_ALLOWED_ORIGINS` to the exact browser origin, for example `https://hearts.duanap.cn`. Set `TRUST_PROXY=1` only when Nginx is the only public entry point and it overwrites `X-Forwarded-For` with the real client IP.

## BaoTa panel deployment

BaoTa's Node project flow is suitable for this app because the backend is a single Node process serving both HTTP static files and WebSocket traffic.

1. Install runtime:
   - Software Store: install Nginx.
   - Software Store: install Node.js version manager.
   - Install Node.js 20 LTS or newer.
2. Upload project:
   - Put the project in `/www/wwwroot/hearts`.
   - Do not use PHP project mode for this app.
3. Install dependencies:

```bash
cd /www/wwwroot/hearts
npm install --omit=dev
npm run check
npm test
```

4. Start with PM2:
   - Website: Node project.
   - Project path: `/www/wwwroot/hearts`
   - Start file: `server.js`
   - Port: `3000`
   - Node version: the installed LTS version.
   - If BaoTa lets you choose a config file, use `ecosystem.config.cjs`.

Command-line equivalent:

```bash
cd /www/wwwroot/hearts
pm2 start ecosystem.config.cjs
pm2 save
```

5. Test local backend:

```bash
curl http://127.0.0.1:3000/healthz
```

The response should contain `"ok":true`.

6. Create a BaoTa site and reverse proxy:
   - Domain: `game.example.com`
   - SSL: enable HTTPS before public release.
   - Reverse proxy target URL: `http://127.0.0.1:3000`
   - If the visual proxy form does not preserve WebSocket upgrade headers, add the Nginx config below manually.

## Nginx reverse proxy

Use HTTPS for public release. WebSocket upgrade must be forwarded.

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.example;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

For BaoTa's generated site config, the important part is the `location /` block:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

7. APK connection:
   - If the APK loads the HTTPS domain directly, no extra client setting is needed.
   - If the APK packages local `public/` assets, open the room panel and set service URL to `https://game.example.com`.
   - The app stores the service URL locally and will actively reconnect to that server.

8. BaoTa firewall and cloud firewall:
   - Open 80 and 443.
   - Port 3000 can stay private if Nginx reverse proxy runs on the same server.

## Release check

Run these before pointing a WebView APK at the server:

```bash
npm run check
npm test
```

Then verify:

- `/healthz` returns JSON with `ok: true`.
- `/assets/`, `/css/app.css`, `/css/pass-animation.css`, `/css/table-ui.css`, `/css/mobile.css`, `/sw.js`, `/manifest.webmanifest`, `/icons/icon.svg`, and `/table-bg-v1210.webp` return 200. The legacy `/js/app.js` script is archived under `public_legacy/js/app.js` and is not part of the current Svelte `public/` build.
- Create room, join room, AI fill, reconnect, leave room, and clear cache work from at least two devices.
