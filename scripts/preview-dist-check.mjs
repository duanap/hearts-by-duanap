import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "frontend", "dist");
const frontendSrcDir = path.join(root, "frontend", "src");

const requiredEntries = [
  "index.html",
  "assets",
  "css",
  "manifest.webmanifest",
  "sw.js",
  "icons",
  "table-bg-v1210.webp"
];

const requiredFiles = [
  "css/app.css",
  "css/pass-animation.css",
  "css/table-ui.css",
  "css/mobile.css",
  "icons/icon.svg"
];

const errors = [];
const warnings = [];

function exists(relativePath) {
  return fs.existsSync(path.join(distDir, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(distDir, relativePath), "utf8");
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function assertExists(relativePath) {
  if (!exists(relativePath)) fail(`Missing frontend/dist/${relativePath}`);
}

function assertPathTarget(url, source) {
  if (!url.startsWith("/")) {
    fail(`${source} uses non-root asset path: ${url}`);
    return;
  }
  if (url === "/" || url.startsWith("/?")) return;
  const normalized = url.split(/[?#]/, 1)[0].slice(1);
  if (!exists(normalized)) fail(`${source} references missing dist asset: ${url}`);
}

function extractRootAssetRefs(html) {
  const refs = [];
  const attrPattern = /\b(?:href|src)=["']([^"']+)["']/g;
  for (const match of html.matchAll(attrPattern)) {
    const value = match[1];
    if (value.startsWith("/")) refs.push(value);
  }
  return refs;
}

function extractAppShell(swText) {
  const match = swText.match(/const\s+APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
  if (!match) return null;
  const items = [];
  const itemPattern = /['"]([^'"]+)['"]/g;
  for (const item of match[1].matchAll(itemPattern)) items.push(item[1]);
  return items;
}

for (const entry of requiredEntries) assertExists(entry);
for (const file of requiredFiles) assertExists(file);

if (exists("assets")) {
  const assetFiles = fs.readdirSync(path.join(distDir, "assets")).filter(name => name.endsWith(".js"));
  if (!assetFiles.length) fail("frontend/dist/assets contains no built JavaScript file");
}

const indexHtml = exists("index.html") ? read("index.html") : "";
if (indexHtml.includes("/src/main.ts")) fail("dist/index.html still references /src/main.ts");
if (!indexHtml.includes('href="/manifest.webmanifest"')) fail("dist/index.html does not reference /manifest.webmanifest");
if (!indexHtml.includes('href="/css/app.css"')) fail("dist/index.html does not reference /css/app.css");
if (!/src="\/assets\/[^"]+\.js"/.test(indexHtml)) fail("dist/index.html does not reference a built /assets/*.js bundle");

for (const ref of extractRootAssetRefs(indexHtml)) {
  assertPathTarget(ref, "dist/index.html");
}

const manifest = exists("manifest.webmanifest") ? JSON.parse(read("manifest.webmanifest")) : null;
if (manifest) {
  if (manifest.scope !== "/") fail("manifest scope should be / for root deployment");
  if (!String(manifest.start_url || "").startsWith("/")) fail("manifest start_url should be root-relative");
  for (const icon of manifest.icons || []) {
    if (icon.src) assertPathTarget(icon.src, "manifest.webmanifest");
  }
}

const swText = exists("sw.js") ? read("sw.js") : "";
if (swText.includes("/js/app.js")) fail("Svelte sw.js must not cache old /js/app.js");
if (!/CACHE_NAME\s*=\s*['"]hearts-online-svelte-v1\.4\.\d+/.test(swText)) {
  fail("Svelte sw.js CACHE_NAME must start with hearts-online-svelte-v1.4.x");
}
const appShell = extractAppShell(swText);
if (!appShell) {
  fail("Could not parse APP_SHELL from frontend/dist/sw.js");
} else {
  for (const shellPath of appShell) {
    if (!shellPath.startsWith("/")) fail(`APP_SHELL item must be root-relative: ${shellPath}`);
    if (shellPath === "/") continue;
    assertPathTarget(shellPath, "frontend/dist/sw.js APP_SHELL");
  }
}

const appCss = exists("css/app.css") ? read("css/app.css") : "";
if (!appCss.includes("table-bg-v1210.webp")) {
  warn("css/app.css does not mention table-bg-v1210.webp; confirm the background image is still referenced elsewhere");
}
if (!exists("table-bg-v1210.webp")) fail("Missing table-bg-v1210.webp");

const builtJsText = exists("assets")
  ? fs.readdirSync(path.join(distDir, "assets"))
      .filter(name => /\.js$/.test(name))
      .map(name => fs.readFileSync(path.join(distDir, "assets", name), "utf8"))
      .join("\n")
  : "";
for (const forbidden of ["VITE_WS_ORIGIN", "127.0.0.1:3000", "localhost:3000", "ws://127.", "ws://localhost"]) {
  if (builtJsText.includes(forbidden)) fail(`Production JavaScript contains development WebSocket marker: ${forbidden}`);
}
if (!builtJsText.includes("location.host")) {
  fail("Production JavaScript should derive the WebSocket host from location.host");
}

const builtSourceMapText = exists("assets")
  ? fs.readdirSync(path.join(distDir, "assets"))
      .filter(name => /\.map$/.test(name))
      .map(name => fs.readFileSync(path.join(distDir, "assets", name), "utf8"))
      .join("\n")
  : "";
for (const forbiddenAddress of ["127.0.0.1:3000", "localhost:3000", "ws://127.", "ws://localhost"]) {
  if (builtSourceMapText.includes(forbiddenAddress)) fail(`Production source map contains development WebSocket address: ${forbiddenAddress}`);
}

const sourceText = fs.existsSync(frontendSrcDir)
  ? fs.readdirSync(frontendSrcDir, { recursive: true })
      .filter(name => String(name).endsWith(".ts") || String(name).endsWith(".svelte"))
      .map(name => fs.readFileSync(path.join(frontendSrcDir, String(name)), "utf8"))
      .join("\n")
  : "";
const registrationIndex = sourceText.indexOf("serviceWorker.register");
if (registrationIndex >= 0 && !sourceText.includes("import.meta.env.PROD")) {
  fail("serviceWorker.register exists in frontend/src but is not visibly gated by import.meta.env.PROD");
}

if (warnings.length) {
  for (const message of warnings) console.warn(`warning: ${message}`);
}
if (errors.length) {
  for (const message of errors) console.error(`error: ${message}`);
  process.exit(1);
}

console.log("preview dist check ok");
