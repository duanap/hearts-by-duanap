# Hearts by duanap

多人在线红心大战卡牌游戏，基于 **Node.js + WebSocket**，支持创建房间、输入房间号加入、多人同步出牌、AI 补位、服务端规则判定和实时计分。

界面采用森林岛牌桌风格，适配 PC 和移动端浏览器，支持 PWA 安装。

## 功能特性

- 首屏选择创建房间或加入房间，支持返回重选
- 4 位数字房间号，优先生成叠数（如 1122、8888）
- 4 人满员自动开始，人数不足时支持 AI 补位
- 房主支持主动解散房间、AI 接管离线玩家
- 玩家接管 AI 牌局需房主审批
- 被 AI 接管的玩家可用相同昵称重新加入
- 断线重连：5 秒宽限期 + 60 秒 AI 托管
- 牌桌互动：12 种表情 + 7 种道具（送花/番茄/砖头/拖鞋/白菜/点赞/鼓掌）
- 首出提示标签、上一轮回看、牌桌全览
- 冲击月亮：收齐 26 分对手归零
- 横屏/全屏独立切换，手机/平板适配
- 深色/浅色主题切换
- PWA 安装到桌面，Service Worker 离线缓存
- 服务端统一发牌、传牌、出牌校验、判定和计分
- 每个玩家只能看到自己的手牌，其他玩家只显示牌背数量
- 房间超时自动清理（默认 5 分钟/60 分钟）

## 技术栈

- HTML / CSS / JavaScript（零构建、零框架）
- Node.js + WebSocket（ws 库）
- PWA（Service Worker + manifest）
- 可选部署：PM2 + Nginx

## 项目结构

```
hearts-by-duanap/
├── server.js                    # 入口文件
├── package.json
├── src/
│   ├── server/
│   │   ├── config.js            # 环境配置
│   │   ├── staticFiles.js       # HTTP 静态文件服务器
│   │   └── realtimeGame.js      # 全部游戏逻辑（~2000行）
│   └── shared/
│       └── constants.js         # 共享常量（SUITS、昵称等）
├── public/
│   ├── index.html               # 游戏页面
│   ├── css/app.css              # 全部样式（~6700行）
│   ├── js/app.js                # 客户端逻辑（~3250行）
│   ├── sw.js                    # Service Worker
│   ├── manifest.webmanifest     # PWA 清单
│   ├── icons/                   # 应用图标
│   ├── audio/                   # 音效资源
│   └── table-bg.webp            # 牌桌背景图
├── AGENTS.md                    # 代理开发指南
├── LICENSE                      # MIT 许可证
└── README.md
```

## 本地运行

建议使用 Node.js 18 或更高版本。

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000`

国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
```

## 局域网联机

查看内网 IP：

```bash
# Windows
ipconfig
# Linux
ip addr
```

其他设备访问 `http://<内网IP>:3000`

## 玩法说明

1. 第一个玩家点击"创建房间"
2. 系统生成 4 位数字房间号
3. 把房间号发给其他玩家
4. 其他玩家输入房间号并点击"加入房间"
5. 满 4 人自动开始，人数不足时房主可点击"AI补位开始"

## 房间超时配置

默认：所有真人玩家离线 5 分钟后自动解散，房间 60 分钟无活动后自动解散。

```bash
ROOM_EMPTY_TTL_MS=600000 ROOM_IDLE_TTL_MS=7200000 npm start
```

PM2 示例：

```bash
ROOM_EMPTY_TTL_MS=600000 ROOM_IDLE_TTL_MS=7200000 pm2 start server.js --name hearts-by-duanap
```

## 部署

### 宝塔面板

1. 安装 Nginx、Node.js 版本管理器、PM2 管理器
2. 上传项目到 `/www/wwwroot/hearts-by-duanap`
3. 安装依赖：

```bash
cd /www/wwwroot/hearts-by-duanap
npm install
```

4. PM2 后台运行：

```bash
pm2 start server.js --name hearts-by-duanap
pm2 save
```

5. Nginx 反向代理配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

## 常见问题

### 页面能打开，但创建房间失败

检查 Nginx 是否包含 WebSocket 代理配置（见上方反向代理配置）。

### 房间突然消失

触发了自动解散规则：所有真人玩家离线超过 5 分钟，或房间超过 60 分钟无操作。调整 `ROOM_EMPTY_TTL_MS` 和 `ROOM_IDLE_TTL_MS`。

## 版本历史

| 版本 | 主要内容 |
|------|----------|
| v1.4.20 | 修复首页卡死（stale roomId / 服务端无响应）、AI 接管支持纯 AI 座位、表情面板动态加载、首出牌闪烁描边、上一墩首出标签移至昵称旁 |
| v1.4.19 | Bug修复、AI策略优化、互动升级、首出提示、接管审批、缓存检查 |
| v1.4.17 稳定版 | 按钮定位优化、横屏适配、调试精简 |
| v1.4 | 互动系统、AI增强、PWA支持、动画全面优化 |
| v1.3 | 动画重做、高光事件系统、UI统一优化 |
| v1.2 | 夜间模式、音效、三国主题、房间面板优化 |
| v1.1 | 网络多人、房间管理、断线重连、横屏适配 |
| v0.3 | 森友会风格视觉、出牌动画、收墩气泡（单机版） |
| v0.2 | 绿色毡布牌桌、弹窗系统、小屏/手机/横屏适配（单机版） |
| v0.1 | 首个完整单机版：深色玻璃风格、完整游戏引擎（单机版） |

## License

[MIT](LICENSE)
