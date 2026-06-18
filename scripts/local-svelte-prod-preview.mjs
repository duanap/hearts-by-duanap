import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const options = parseArgs(process.argv.slice(2));
const host = options.host || "127.0.0.1";
const port = Number(options.port || 4178);
const backendOrigin = new URL(options.backend || "http://127.0.0.1:3000");
const distDir = path.resolve(root, options.dist || "frontend/dist");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webp", "image/webp"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
  [".map", "application/json; charset=utf-8"]
]);

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (!item.startsWith("--")) continue;
    const [key, inlineValue] = item.slice(2).split("=", 2);
    result[key] = inlineValue ?? args[index + 1] ?? "";
    if (inlineValue == null) index += 1;
  }
  return result;
}

function assertDistReady() {
  const required = [
    "index.html",
    "assets",
    "css",
    "manifest.webmanifest",
    "sw.js",
    "icons",
    "table-bg-v1210.webp"
  ];
  for (const item of required) {
    if (!fs.existsSync(path.join(distDir, item))) {
      throw new Error(`Missing frontend/dist production asset: ${item}`);
    }
  }
}

function resolveStaticPath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const candidate = path.resolve(distDir, `.${pathname}`);
  if (!candidate.startsWith(distDir)) return null;

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  // Keep SPA-style navigation working without turning asset 404s into index.html.
  if (!path.extname(pathname)) {
    const indexPath = path.join(distDir, "index.html");
    if (fs.existsSync(indexPath)) return indexPath;
  }
  return null;
}

function proxyHealthz(req, res) {
  const request = http.request({
    hostname: backendOrigin.hostname,
    port: backendOrigin.port || 80,
    path: "/healthz",
    method: req.method,
    headers: { host: backendOrigin.host }
  }, backendResponse => {
    res.writeHead(backendResponse.statusCode || 502, backendResponse.headers);
    backendResponse.pipe(res);
  });

  request.on("error", error => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`backend healthz unavailable: ${error.message}`);
  });
  request.end();
}

function serveStatic(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "")) {
    res.writeHead(405, { allow: "GET, HEAD" });
    res.end();
    return;
  }

  if ((req.url || "").split("?", 1)[0] === "/healthz") {
    proxyHealthz(req, res);
    return;
  }

  const filePath = resolveStaticPath(req.url || "/");
  if (!filePath) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const extension = path.extname(filePath);
  const contentType = mimeTypes.get(extension) || "application/octet-stream";
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "content-type": contentType,
    "content-length": stat.size,
    "cache-control": "no-store"
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function proxyWebSocket(req, clientSocket, head) {
  const backendPort = Number(backendOrigin.port || 80);
  const backendSocket = net.connect(backendPort, backendOrigin.hostname, () => {
    const headerLines = [`GET ${req.url || "/"} HTTP/1.1`, `Host: ${backendOrigin.host}`];
    for (let index = 0; index < req.rawHeaders.length; index += 2) {
      const name = req.rawHeaders[index];
      const value = req.rawHeaders[index + 1];
      if (name.toLowerCase() === "host") continue;
      headerLines.push(`${name}: ${value}`);
    }
    backendSocket.write(`${headerLines.join("\r\n")}\r\n\r\n`);
    if (head.length) backendSocket.write(head);
    clientSocket.pipe(backendSocket).pipe(clientSocket);
  });

  backendSocket.on("error", error => {
    console.error(`[preview] websocket backend error: ${error.message}`);
    clientSocket.destroy();
  });
  clientSocket.on("error", () => backendSocket.destroy());
  console.log(`[preview] ws ${req.headers.host}${req.url || "/"} -> ${backendOrigin.host}`);
}

assertDistReady();

const server = http.createServer(serveStatic);
server.on("upgrade", proxyWebSocket);

server.listen(port, host, () => {
  console.log("Local Svelte production preview only; do not use for production deployment.");
  console.log(`Static root: ${distDir}`);
  console.log(`Preview URL: http://${host}:${port}/`);
  console.log(`WebSocket proxy: ws://${host}:${port}/ -> ${backendOrigin.href.replace(/^http/, "ws")}`);
  console.log("Service worker is served as a static file but is not registered by the Svelte app.");
});

server.on("error", error => {
  console.error(`[preview] failed to start: ${error.message}`);
  process.exit(1);
});
