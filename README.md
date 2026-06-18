# 红心大战 Hearts Online

基于 **Svelte + Vite + TypeScript + Node.js + WebSocket** 的联机红心大战。服务端负责房间、发牌、传牌、出牌校验、计分、AI 补位和断线处理；前端负责牌桌 UI、动画、音效、互动和移动端横屏体验。

当前版本：`1.4.22`

## 当前状态

- 前端源码在 `frontend/src/`，构建产物输出到 `frontend/dist/`。
- 线上静态目录是根目录 `public/`，需要由 `frontend/dist/` 同步而来。
- Node 服务通过 `server.js` 同源托管 `public/` 和 WebSocket 游戏服务。
- Android 使用 Capacitor，`capacitor.config.json` 的 `webDir` 是 `public`。
- 当前 Android 包名是 `com.duanap.hearts`。
- 旧版非 Svelte 前端保存在 `public_legacy/`，当前 `public/` 不应包含 `public/js/app.js`。

## 项目结构

```txt
.
├── server.js                         # Node HTTP + WebSocket 入口
├── src/server/
│   ├── config.js                     # 根目录、public 目录、端口、版本
│   ├── env.js                        # 环境变量读取工具
│   ├── staticFiles.js                # 静态资源与 /healthz
│   ├── rateLimiter.js                # WebSocket 消息限流
│   └── realtimeGame.js               # 房间、规则、AI、WebSocket 协议
├── frontend/
│   ├── vite.config.ts                # Svelte/Vite 构建配置
│   ├── public/                       # Vite publicDir，复制进 dist
│   ├── dist/                         # npm run build 输出目录
│   └── src/
│       ├── App.svelte                # 前端组合入口
│       ├── components/               # 牌桌、弹窗、覆盖层组件
│       ├── services/                 # WebSocket、音频、布局、动画服务
│       ├── stores/gameStore.ts       # 前端状态、持久化和消息处理
│       ├── types/messages.ts         # 前后端消息类型
│       └── utils/                    # 牌面、格式化、几何和互动工具
├── public/                           # Node/Capacitor 当前使用的静态目录
├── public_legacy/                    # 旧版 public 归档
├── android/                          # Capacitor Android 工程
├── scripts/
│   ├── check.js                      # 静态/配置一致性检查
│   ├── smoke-test.js                 # HTTP + WebSocket 冒烟测试
│   ├── browser-check.js              # 浏览器视觉/交互检查
│   ├── preview-dist-check.mjs        # frontend/dist 生产预览检查
│   ├── cutover-*.example.*           # public 替换示例脚本
│   └── rollback-linux.example.sh     # public 回滚示例脚本
├── docs/
│   ├── deployment.md                 # 宝塔/反代部署说明
│   ├── svelte-production-cutover.md  # Svelte 替换 public 清单
│   └── webview-apk.md                # WebView/APK 打包说明
├── .env.example                      # 环境变量模板
├── capacitor.config.json             # Capacitor webDir/appId
└── package.json
```

## 模块关系

```txt
Browser / Android WebView
  ↓ HTTP(S), WS(S)
server.js
  ├─ staticFiles.js  -> public/
  └─ realtimeGame.js -> ws room/game protocol
       ├─ rateLimiter.js
       └─ env.js

frontend/src
  ├─ wsClient.ts      -> WebSocket 连接、心跳、重连、reconnectToken
  ├─ gameStore.ts    -> 前端状态、localStorage、服务端消息落地
  ├─ components/     -> Svelte UI
  └─ utils/          -> 牌面/规则展示/布局辅助
```

## 功能概览

- 4 位数字房间号，优先生成易记房号。
- 4 人满员自动开始；人数不足时房主可 AI 补位。
- 服务端统一发牌、传牌、出牌校验、判定和计分。
- 支持断线重连、主动退出、房主解散、房主迁移。
- 离线玩家可由房主设置 AI 接管；重连需要本机保存的 `reconnectToken`。
- 前端支持横屏提示、全屏、音效、动画、上一墩、查看牌桌、互动表情和特效。
- 房间自动清理：默认全员离线 5 分钟解散，房间无活动 60 分钟解散。

## 环境要求

- Node.js 20 LTS 或更新版本。线上当前建议 Node.js 22。
- npm。
- 构建 Android APK 时需要 Android Studio/JDK/Gradle 环境。

## 本地开发

安装依赖：

```bash
npm ci
```

启动 Node 服务，使用当前 `public/`：

```bash
npm start
```

浏览器打开：

```txt
http://127.0.0.1:3000/
```

启动 Vite 开发服务：

```bash
npm run dev
```

如果 Vite 前端需要连接本地 Node 后端，可以临时设置：

```bash
VITE_WS_ORIGIN=http://127.0.0.1:3000 npm run dev
```

Windows PowerShell 如果拦截 `npm.ps1`，使用：

```bat
npm.cmd ci
npm.cmd run build
```

## 常用命令

```bash
npm run check
npm test
npm run frontend:check
npm run build
```

命令含义：

- `npm run check`：检查 JS 语法、public 资源、Service Worker 缓存清单和 Svelte public 状态。
- `npm test`：启动临时 HTTP/WebSocket 服务，跑创建房间、加入、传牌/出牌冒烟流程。
- `npm run frontend:check`：运行 `svelte-check`。
- `npm run build`：构建 Svelte 前端到 `frontend/dist/`。

## 构建和同步 public

生产前端构建：

```bash
npm run build
```

然后把 `frontend/dist/` 内容同步到 `public/`。Windows PowerShell 示例：

```powershell
$root = (Resolve-Path -LiteralPath ".").Path
$dist = Join-Path $root "frontend\dist"
$public = Join-Path $root "public"
Get-ChildItem -LiteralPath $public -Force | Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $dist -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $public -Recurse -Force
}
npm run check
```

注意：当前 `public/` 是 Svelte 构建产物，不应再出现 `public/js/app.js`。

## 环境变量

复制 `.env.example` 后按部署环境调整。常用项：

```env
PORT=3000
ROOM_EMPTY_TTL_MS=300000
ROOM_IDLE_TTL_MS=3600000
ROOM_SWEEP_INTERVAL_MS=30000
DISCONNECT_GRACE_MS=5000
OFFLINE_TAKEOVER_MS=60000
OFFLINE_TAKEOVER_SWEEP_MS=10000
WS_MESSAGE_LIMIT=120
WS_MESSAGE_WINDOW_MS=30000
WS_MAX_PAYLOAD_BYTES=16384
WS_ALLOWED_ORIGINS=https://hearts.duanap.cn
TRUST_PROXY=0
```

说明：

- `WS_ALLOWED_ORIGINS` 用于限制浏览器 WebSocket Origin。生产建议设置为 `https://hearts.duanap.cn`。
- `TRUST_PROXY=1` 只有在源站无法被绕过、且反代可信地覆盖 `X-Forwarded-For` 时才开启。
- 如果 EdgeOne 免费版无法稳定限制源站直连，保持 `TRUST_PROXY=0` 更保守。

## 生产部署建议

当前推荐链路：

```txt
用户 HTTPS/WSS
  -> EdgeOne
  -> HTTP/WS 回源到宝塔 Nginx:80
  -> http://127.0.0.1:3000 Node
```

EdgeOne 建议：

- 开启 HTTPS。
- 开启强制 HTTPS。
- 开启 WebSocket。
- 回源协议固定 HTTP，不使用协议跟随。
- 源站指向轻量服务器 80 端口。

宝塔/Nginx 核心反代：

```nginx
server
{
    listen 80;
    listen [::]:80;
    server_name hearts.duanap.cn;

    # 宝塔 SSL 插入锚点。当前由 EdgeOne 处理 HTTPS，宝塔通常不需要启用 SSL。
    #error_page 404/404.html;

    include /www/server/panel/vhost/nginx/well-known/hearts.duanap.cn.conf;

    location ^~ /.well-known/ {
        allow all;
    }

    location ~* /(\.git|\.svn|\.bzr|\.vscode|\.idea|\.ssh|\.github|\.npm|\.yarn|\.pnpm|\.cache|node_modules|runtime)/ {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;

        proxy_buffering off;
    }

    access_log  /www/wwwlogs/hearts.duanap.cn.log;
    error_log   /www/wwwlogs/hearts.duanap.cn.error.log;
}
```

启动服务：

```bash
cd /www/wwwroot/hearts
npm ci --omit=dev
npm start
```

PM2 示例：

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

上线检查：

```bash
curl -fsS http://127.0.0.1:3000/healthz
curl -fsS https://hearts.duanap.cn/healthz
```

浏览器 Network 面板确认 WebSocket 地址是：

```txt
wss://hearts.duanap.cn/
```

## Android / APK

当前 Android 工程由 Capacitor 管理：

- `appId`: `com.duanap.hearts`
- `webDir`: `public`
- 主 Activity：`android/app/src/main/java/com/duanap/hearts/MainActivity.java`
- `android:allowBackup="false"`

构建 APK 前先同步最新 Web 产物：

```bash
npm run build
# 同步 frontend/dist 到 public 后：
npx cap sync android
```

构建 debug APK：

```bat
cd android
gradlew.bat assembleDebug
```

输出：

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

## 检查清单

提交或发布前建议至少运行：

```bash
npm run check
npm test
npm run frontend:check
npm run build
npm audit
```

如果更新了前端产物，还需要：

1. 同步 `frontend/dist/` 到 `public/`。
2. 重新运行 `npm run check`。
3. 重新 `npx cap sync android`。
4. 需要 APK 时重新构建 Android。

## 已知注意事项

- `public/` 是发布目录，不是前端源码目录；前端源码改动必须先构建。
- `public_legacy/` 是旧版前端归档，不参与当前构建。
- `.env` 不应提交。
- `node_modules/`、Android 构建产物、APK、`.codex*.png` 和 `public_backup_*/` 已在 `.gitignore` 中忽略。
- `TRUST_PROXY=0` 时，服务端限流按直接连接 IP 计算；经过 EdgeOne 时可能看到的是 EdgeOne 节点 IP，但能避免源站直连伪造 `X-Forwarded-For`。

## License

MIT License
