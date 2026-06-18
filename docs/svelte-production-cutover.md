# Svelte 生产替换预演清单

本文档用于 Hearts Svelte 前端替换预演。当前不是正式上线，不直接替换根目录 `public/`。

## 当前约束

- 旧线上前端仍在根目录 `public/`。
- Svelte 新前端构建产物在 `frontend/dist/`。
- `server.js` 仍托管根目录 `public/`。
- `capacitor.config.json` 的 `webDir` 仍是 `public`。
- 线上域名是 `https://hearts.duanap.cn/`。
- 生产 WebSocket 必须继续同源连接：`wss://hearts.duanap.cn/`。

## 1. frontend/dist 完整性

正式替换前先执行：

```bash
npm run build
node scripts/preview-dist-check.mjs
```

`frontend/dist/` 必须包含：

- `index.html`
- `assets/`
- `css/`
- `manifest.webmanifest`
- `sw.js`
- `icons/`
- `table-bg-v1210.webp`

当前 Svelte 构建使用根路径部署，`frontend/dist/index.html` 中应使用：

- `/manifest.webmanifest`
- `/assets/*.js`
- `/css/app.css`
- `/css/pass-animation.css`
- `/css/table-ui.css`
- `/css/mobile.css`
- `/icons/icon.svg`

`table-bg-v1210.webp` 不需要直接出现在 `index.html`，但必须存在于 `frontend/dist/`，并由 CSS 或运行时资源使用。

生产包内不得出现：

- `/src/main.ts`
- `/js/app.js`
- `VITE_WS_ORIGIN`
- `127.0.0.1:3000`
- `localhost:3000`
- `ws://127.*`
- `ws://localhost`

## 2. Service Worker 策略

旧版 `public/sw.js`：

- cache name: `hearts-online-v1.4.22-room-status-actions`
- 预缓存旧版 `/js/app.js`
- 当前不要修改。

Svelte 版 `frontend/public/sw.js`：

- cache name: `hearts-online-svelte-v1.4.22`
- 不缓存旧 `/js/app.js`
- 预缓存 Svelte 版实际存在的 shell 资源：
  - `/`
  - `/index.html`
  - `/css/app.css`
  - `/css/pass-animation.css`
  - `/css/table-ui.css`
  - `/css/mobile.css`
  - `/manifest.webmanifest`
  - `/icons/icon.svg`
  - `/table-bg-v1210.webp`
- `/assets/*.js` 是 Vite hash 文件，不写死到 `APP_SHELL`；首次网络请求后由 fetch handler 运行时缓存。

当前 Svelte 版没有注册 Service Worker。预演阶段保持不注册，避免 Vite dev 模式缓存开发文件。

正式上线前有两种选择：

1. 如果需要新用户也安装 PWA 缓存，在 `frontend/src/main.ts` 增加生产环境注册：

```ts
if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  });
}
```

2. 如果上线第一版希望降低 SW 风险，可以暂不注册。旧用户已有的根 scope SW 会在浏览器检查 `/sw.js` 时更新，但新用户不会创建缓存。

第 11 组最终候选结论：首版 Svelte 正式替换 `public/` 时，建议先不注册 Service Worker。保留 `frontend/dist/sw.js` 文件，但不在 `frontend/src/main.ts` 主动注册。这样可以降低旧缓存、白屏、hash 资源版本混乱和手机浏览器缓存滞留风险。等 Svelte 线上稳定后，再单独做 PWA 缓存启用小版本。

旧缓存刷新策略：

- 每次正式替换都更新 Svelte SW 的 `CACHE_NAME`。
- `sw.js` 已使用 `skipWaiting()` 和 `clients.claim()`，新版激活后会删除旧 cache name。
- 若用户仍看到旧版，指导用户使用设置里的“刷新缓存”，或浏览器强制刷新/清站点数据。
- 宝塔/Nginx 不应长时间缓存 `/sw.js`；上线后用浏览器 Network 面板确认 `/sw.js` 是新内容。

## 3. 方案 A：Windows 本地替换预案

适用路径：`H:/hearts`

本轮只生成脚本，不执行替换：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cutover-windows.example.ps1
```

默认是 dry-run，只打印步骤。

真正执行时必须显式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cutover-windows.example.ps1 -Execute
```

执行脚本会要求输入 `CUTOVER` 后才继续。

实际步骤：

1. 运行 `node scripts/preview-dist-check.mjs`。
2. 备份 `public/` 到 `public_backup_时间戳/`。
3. 清空 `public/` 内容。
4. 复制 `frontend/dist/` 内容到 `public/`。
5. 检查 `public/index.html`。
6. 检查 `public/manifest.webmanifest`。
7. 检查 `public/sw.js`。
8. 检查 `public/assets`、`public/css`、`public/icons`。

## 4. 方案 B：宝塔 Linux 替换预案

适用服务器路径：`/www/wwwroot/hearts.duanap.cn`

本轮只生成脚本，不执行替换：

```bash
bash scripts/cutover-linux.example.sh
```

默认是 dry-run。正式执行需要：

```bash
cd /www/wwwroot/hearts.duanap.cn
EXECUTE=1 CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER bash scripts/cutover-linux.example.sh
```

实际步骤：

1. `cd /www/wwwroot/hearts.duanap.cn`
2. 运行 `node scripts/preview-dist-check.mjs`
3. 备份 `public/` 到 `public_backup_时间戳/`
4. 清空 `public/`
5. 上传或同步 `frontend/dist/` 到 `public/`
6. 检查 `public/index.html`
7. 检查 `public/manifest.webmanifest`
8. 检查 `public/sw.js`
9. 检查 `public/assets`、`public/css`、`public/icons`
10. `pm2 restart hearts-online`
11. `nginx -t`
12. `nginx -s reload`
13. `curl -fsS http://127.0.0.1:3000/healthz`
14. `curl -fsS https://hearts.duanap.cn/healthz`

如果服务器没有 `frontend/dist/`，先在本地构建并上传 dist 内容到服务器，再把 `DIST_SOURCE` 指向上传目录：

```bash
DIST_SOURCE=/tmp/hearts-svelte-dist EXECUTE=1 CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER bash scripts/cutover-linux.example.sh
```

## 5. 回滚方案

回滚脚本默认 dry-run：

```bash
bash scripts/rollback-linux.example.sh /www/wwwroot/hearts.duanap.cn/public_backup_YYYYMMDD-HHMMSS
```

正式执行：

```bash
cd /www/wwwroot/hearts.duanap.cn
EXECUTE=1 ROLLBACK_CONFIRM=RESTORE_PUBLIC_BACKUP bash scripts/rollback-linux.example.sh /www/wwwroot/hearts.duanap.cn/public_backup_YYYYMMDD-HHMMSS
```

回滚步骤：

1. 停止当前替换操作。
2. 确认备份目录存在且包含旧版 `index.html`、`sw.js`、`manifest.webmanifest`。
3. 将错误的 `public/` 移到 `public_failed_时间戳/`，不要立即永久删除。
4. 从 `public_backup_时间戳/` 恢复 `public/`。
5. `pm2 restart hearts-online`。
6. `nginx -t`。
7. `nginx -s reload`。
8. 清浏览器缓存，或再次更新/回退 `sw.js` cache name。
9. 验证 `https://hearts.duanap.cn/` 回到旧版。
10. 验证无误后再手动删除 `public_failed_时间戳/`。

## 6. 上线后生产验证清单

- `https://hearts.duanap.cn/` 可访问。
- `https://hearts.duanap.cn/healthz` 返回 `ok`。
- 控制台无 404。
- `manifest.webmanifest` 正常返回。
- `sw.js` 正常返回。
- 背景图 `table-bg-v1210.webp` 正常加载。
- WebSocket 连接是 `wss://hearts.duanap.cn/`。
- 创建房间成功。
- 手机加入房间成功。
- AI 补位开始成功。
- 传牌成功。
- 出牌成功。
- 完整打一局后结算成功。
- 下一局成功。
- 设置、日志、规则、回看弹窗可用。
- 手机竖屏、横屏、强制横屏可用。
- 刷新页面后不会加载旧 `/js/app.js`。
- 浏览器 Application 面板里的 cache name 是 `hearts-online-svelte-v1.4.22` 或更新版本。

## 7. Android / Capacitor 预案

当前状态：

- `capacitor.config.json` 的 `webDir` 是 `public`。
- 本轮不修改 `android/`。
- 本轮不执行 `npx cap sync android`。

正式替换 `public/` 后，Android 同步命令：

```bash
npx cap sync android
```

如果只想让 Android 直接使用 `frontend/dist`，需要改 `capacitor.config.json`：

```json
{
  "webDir": "frontend/dist"
}
```

当前不建议这么做，因为线上 Node 静态托管仍然使用根目录 `public/`，保持 Android 与线上 public 一致更容易验证和回滚。

APK 打包前需要检查：

- app 名称。
- app 图标。
- `versionName`。
- `versionCode`。
- 网络权限。
- Android WebView 是否能正常连接 `wss://hearts.duanap.cn/`。
- WebView 缓存是否仍保留旧版 `public/`。

## 8. 风险清单

- `public/` 被误删或备份失败。
- Service Worker 继续缓存旧文件。
- Vite 资源路径错误，导致 `/assets/*.js` 或 `/css/*.css` 404。
- 开发 WebSocket 地址泄露到生产包。
- `manifest.webmanifest` 或图标丢失。
- 宝塔 PM2 重启失败。
- Nginx 配置检查失败或 reload 失败。
- 手机浏览器仍使用旧缓存。
- Android APK 仍打包旧 `public/`。
- Svelte 版尚未迁移完整互动飞行动画。
- 新用户如果没有生产环境 SW 注册逻辑，不会创建 PWA 缓存。

## 9. 最低执行顺序

正式上线前推荐顺序：

1. `npm run build`
2. `node scripts/preview-dist-check.mjs`
3. `npm run frontend:check`
4. `npm run check`
5. `npm test`
6. 执行 Windows 或 Linux dry-run 脚本。
7. 确认备份目录、dist 完整性和回滚脚本可用。
8. 维护窗口内执行正式替换。
9. 逐项跑生产验证清单。

## 10. 本地临时生产演练

第 8 组使用本地临时服务验证 `frontend/dist/` 是否可以作为 `public/` 使用，不替换根目录 `public/`。

启动前先运行：

```bash
npm run build
node scripts/preview-dist-check.mjs
```

确认本机 3000 后端已经运行：

```bash
node server.js
```

然后启动临时演练服务：

```bash
node scripts/local-svelte-prod-preview.mjs
```

默认访问地址：

```text
http://127.0.0.1:4178/
```

这个脚本只用于开发测试：

- 静态托管 `frontend/dist/`。
- 不使用 Vite dev server。
- 不写入或替换根目录 `public/`。
- 不修改 `server.js`。
- 把浏览器发起的同源 `ws://127.0.0.1:4178/` WebSocket upgrade 代理到 `http://127.0.0.1:3000` 后端。
- `/healthz` 代理到本机 3000 后端，便于验证。

这能模拟生产同源 WebSocket 形态：生产环境仍然必须使用 `ws/wss://${location.host}`，线上实际地址是 `wss://hearts.duanap.cn/`。

演练验证清单：

1. `http://127.0.0.1:4178/` 可访问。
2. 页面脚本来自 `/assets/*.js`。
3. CSS 来自 `/css/*.css`。
4. `manifest.webmanifest` 可访问。
5. `sw.js` 可访问但未被 Svelte app 主动注册。
6. `table-bg-v1210.webp` 可访问。
7. `icons/icon.svg` 可访问。
8. 浏览器控制台没有明显 404。
9. WebSocket 不连接 Vite 端口。
10. 创建房间成功。
11. AI 补位开始成功。
12. 传牌成功。
13. 出牌成功。
14. 至少完成一墩。
15. 设置、日志、规则、结算、牌桌回看弹窗可打开。

## 11. 本轮不注册 Service Worker 的原因

第 8 组仍然不在 `frontend/src/main.ts` 注册 Service Worker：

- Svelte 版还没有正式替换根目录 `public/`。
- 过早注册会污染本地临时演练缓存。
- 当前目标是验证 `frontend/dist/` 的静态托管和同源 WebSocket。
- 正式上线前最后一轮再决定是否启用 PWA。

如果正式上线要启用 PWA，新用户需要在生产环境注册 `/sw.js`。建议注册代码放在 `frontend/src/main.ts`，并使用 `import.meta.env.PROD` 限制：

```ts
if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  });
}
```

正式上线前决策点：

- 首版 Svelte 替换建议继续不注册 SW，仅替换静态页面。
- 如果需要 PWA 离线缓存和安装体验，则在最后一轮加入生产注册逻辑，并重新运行完整验证。

上线后如果发现旧缓存：

1. 确认 `/sw.js` cache name 已更新。
2. 指导用户刷新页面或清站点数据。
3. 使用设置弹窗里的“刷新缓存”清理浏览器缓存。
4. 浏览器 Application 面板中 unregister 旧 service worker。
5. 确认刷新后不再请求旧 `/js/app.js`。

本地临时生产演练通过后，下一步才允许考虑正式替换根目录 `public/`。

## 12. 第 11 组最终候选验证清单

本清单用于正式替换 `public/` 前最后确认。本轮仍然不执行正式替换。

功能回归：

1. 创建房间成功。
2. AI 补位开始成功。
3. 传 3 张牌成功。
4. 传牌飞行动画出现。
5. 接收传入牌高亮正常。
6. 出牌成功。
7. 非法出牌提示正常。
8. 至少完成一墩。
9. 收墩飞行动画出现。
10. 互动菜单正常。
11. 点赞、送花、番茄、鼓掌正常。
12. 互动飞行动画正常。
13. 设置弹窗正常。
14. 日志弹窗正常。
15. 规则弹窗正常。
16. 牌桌回看正常。
17. 完整打一局后结算正常。
18. 下一局正常。
19. 当前阶段支持重新开始时验证重新开始。
20. 控制台无明显 error/warning。

移动端复核：

1. 桌面浏览器正常。
2. 手机竖屏模拟正常。
3. 手机横屏模拟正常。
4. `force-landscape` 正常。
5. 全屏按钮正常，或浏览器限制时显示 toast。
6. 传牌飞行动画在手机竖屏不严重错位。
7. 收墩动画在手机横屏不严重错位。
8. 互动菜单在 `force-landscape` 下不出视口。
9. 结算、设置、日志、规则弹窗在移动端可关闭。
10. Toast 和 offline banner 不遮挡关键按钮。

设置和开关：

1. 音效开关可切换。
2. 特效开关可切换。
3. 动画速度可切换。
4. 互动开关可切换。
5. 互动音效开关可切换。
6. 横屏提示开关可切换。
7. 强制横屏开关可切换。
8. 刷新后 localStorage 设置仍保留。
9. 清缓存按钮有确认，不会删除服务器文件。
10. 关闭特效后传牌、收墩、互动复杂飞行动画不播放，主流程仍正常。

## 13. 受控特殊事件验证

生产构建不提供测试按钮，也不暴露测试入口。为了验证射月和特殊事件基础展示，源码中只允许开发环境安装临时 helper：

```ts
window.__HEARTS_DEV__.triggerMoonEvent()
window.__HEARTS_DEV__.triggerSpecialEvent()
window.__HEARTS_DEV__.setEffectsEnabled(false)
```

约束：

- 只在 `import.meta.env.DEV` 下动态导入。
- 不进入生产构建行为。
- 不修改后端规则。
- 不修改 WebSocket 协议。
- 不在 UI 中增加测试按钮。

验证目标：

- `moon-effect` 能显示。
- `special-event` 能显示。
- `moon-effect-active` 能在结束后清理。
- 特效关闭后复杂特殊事件展示不播放。
- 控制台无错误。

正式替换前必须再次检查生产构建中不包含：

- `__HEARTS_DEV__`
- `triggerMoonEvent`
- `triggerSpecialEvent`

## 14. 首版暂不注册 SW 的最终建议

首版 Svelte 替换 `public/` 时建议不注册 Service Worker：

1. 新前端首次上线时，最重要的是验证静态资源、同源 WebSocket 和核心游戏流程。
2. 旧版已经存在根 scope SW，过早叠加注册逻辑会增加缓存命中旧文件的排查成本。
3. Vite hash 资源和旧 `/js/app.js` 的缓存策略不同，先不上 SW 更容易确认真实线上行为。
4. 手机浏览器对 SW 更新时机更保守，首版启用会增加“用户仍看到旧版”的风险。

后续启用 SW 的步骤：

1. 更新 `frontend/public/sw.js` 的 `CACHE_NAME`，例如 `hearts-online-svelte-v1.4.23-pwa1`。
2. 在 `frontend/src/main.ts` 中加入 `import.meta.env.PROD` 限制的注册逻辑。
3. 重新运行 `npm run build`、`node scripts/preview-dist-check.mjs` 和完整浏览器验证。
4. 上线后检查 Application 面板 cache name 是否为新版。
5. 如果用户仍看到旧缓存，使用设置弹窗清缓存、浏览器强刷或 Application 面板 unregister。

## 15. 正式替换 `public/` 前最终上线确认

上线前确认：

1. 当前 `public/` 已备份。
2. `frontend/dist/` 检查通过。
3. 本地生产演练通过。
4. Windows/Linux cutover 脚本 dry-run 通过。
5. rollback 脚本 dry-run 通过。
6. 宝塔 PM2 当前服务名确认是 `hearts-online`。
7. Nginx 反向代理仍是 `127.0.0.1:3000`。
8. `/healthz` 正常。
9. SSL 正常。
10. WebSocket 反向代理支持 Upgrade。
11. 维护窗口确认。
12. 回滚负责人确认。
13. 验证设备准备：桌面浏览器、手机浏览器、后续 Android APK 验证设备。

本地 Windows 预案：

1. `npm run build`
2. `node scripts/preview-dist-check.mjs`
3. `powershell -ExecutionPolicy Bypass -File scripts/cutover-windows.example.ps1`
4. 真正替换时才使用 `-Execute`，并按脚本要求输入确认词。

宝塔 Linux 预案：

1. 上传最新代码或 `frontend/dist/`。
2. 如依赖变化，执行 `npm install --omit=dev`。
3. 如在服务器构建，执行 `npm run build`。
4. `node scripts/preview-dist-check.mjs`
5. `bash scripts/cutover-linux.example.sh`
6. 真正替换时才设置 `EXECUTE=1 CUTOVER_CONFIRM=SVELTE_PUBLIC_CUTOVER`。
7. `pm2 restart hearts-online`
8. `nginx -t`
9. `nginx -s reload`
10. `curl -fsS http://127.0.0.1:3000/healthz`
11. `curl -fsS https://hearts.duanap.cn/healthz`

## 16. 回滚最终确认

`scripts/rollback-linux.example.sh` 默认 dry-run。正式回滚前确认：

1. 通过 `ls -d public_backup_*` 或上线记录找到目标备份目录。
2. dry-run：`bash scripts/rollback-linux.example.sh /www/wwwroot/hearts.duanap.cn/public_backup_YYYYMMDD-HHMMSS`
3. 正式回滚：`EXECUTE=1 ROLLBACK_CONFIRM=RESTORE_PUBLIC_BACKUP bash scripts/rollback-linux.example.sh /www/wwwroot/hearts.duanap.cn/public_backup_YYYYMMDD-HHMMSS`
4. 脚本会把当前错误 `public/` 移到 `public_failed_时间戳/`，再恢复备份。
5. 脚本会重启 `pm2 restart hearts-online`，并执行 `nginx -t`、`nginx -s reload`。
6. 回滚后清理浏览器缓存，必要时 unregister Service Worker。
7. 验证 `https://hearts.duanap.cn/` 回到旧版，并确认刷新后不加载 Svelte hash assets。
