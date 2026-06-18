const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const TARGET_URL = process.env.BROWSER_CHECK_URL || 'http://127.0.0.1:3000/';

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const candidates = process.platform === 'win32'
    ? [
        path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.ProgramFiles || '', 'Microsoft/Edge/Application/msedge.exe'),
        path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft/Edge/Application/msedge.exe')
      ]
    : [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/microsoft-edge'
      ];

  return candidates.find(candidate => candidate && fs.existsSync(candidate));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForJson(url, timeout = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      // Chrome may need a moment to expose the debugging endpoint.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForPageTarget(port, timeout = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`, 1000);
      const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch (error) {
      // Keep polling until Chrome finishes initializing the page target.
    }
    await wait(100);
  }
  throw new Error('Timed out waiting for a Chrome page target');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeDirWithRetry(dir) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 9) throw error;
      await wait(250);
    }
  }
}

function connectCdp(webSocketDebuggerUrl) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  const eventWaiters = new Map();
  let nextId = 1;

  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ''}`.trim()));
      else resolve(message.result || {});
      return;
    }

    const waiters = eventWaiters.get(message.method);
    if (waiters && waiters.length) waiters.shift()(message.params || {});
  });

  function send(method, params = {}) {
    const id = nextId++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, 10_000);
    });
  }

  function waitForEvent(method, timeout = 10_000) {
    return new Promise((resolve, reject) => {
      const waiters = eventWaiters.get(method) || [];
      waiters.push(resolve);
      eventWaiters.set(method, waiters);
      setTimeout(() => reject(new Error(`CDP event timed out: ${method}`)), timeout);
    });
  }

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve({ ws, send, waitForEvent }));
    ws.addEventListener('error', reject);
  });
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result.value;
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) throw new Error('Chrome or Edge executable was not found. Set CHROME_PATH to run browser checks.');

  const port = await getFreePort();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hearts-browser-check-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${port}`,
    '--window-size=390,844',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    const page = await waitForPageTarget(port);
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    const { send, waitForEvent } = cdp;

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });

    const loaded = waitForEvent('Page.loadEventFired');
    await send('Page.navigate', { url: TARGET_URL });
    await loaded;

    const diagnostics = await evaluate(send, `new Promise(resolve => {
      setTimeout(() => {
        const lastButton = document.getElementById('lastTrickBtn');
        const resultModal = document.getElementById('resultModal');
        const scoreBoard = document.getElementById('resultScoreTable');
        if (lastButton) lastButton.classList.remove('hidden');
        if (scoreBoard) {
          scoreBoard.innerHTML = Array.from({ length: 12 }, (_, index) => '<div class="result-player-card"><div class="result-rank-medal">' + (index + 1) + '</div><div class="result-player-main"><div class="result-player-name">Player ' + (index + 1) + '</div><div class="result-player-sub">mobile scroll sample</div></div><div class="result-score-pill total"><span>Total</span><strong>' + (index * 7) + '</strong></div><div class="result-score-pill"><span>Round</span><strong>' + index + '</strong></div><div class="result-badge-wrap"><span class="result-keep-going">Sample</span></div></div>').join('');
        }
        if (resultModal) resultModal.classList.remove('hidden');

        const lastStyle = lastButton ? getComputedStyle(lastButton) : null;
        const serverPanel = document.getElementById('serverConnectPanel');
        const roomStatus = document.getElementById('roomStatus');
        const viewTableBtn = document.getElementById('viewRoundTableBtn');
        const card = resultModal ? resultModal.querySelector('.result-card') : null;
        const cardStyle = card ? getComputedStyle(card) : null;
        const scoreStyle = scoreBoard ? getComputedStyle(scoreBoard) : null;
        resolve({
          htmlDevice: document.documentElement.dataset.screenDevice,
          htmlOrientation: document.documentElement.dataset.screenOrientation,
          bodyClasses: document.body.className,
          hasSplitStyles: Boolean(document.querySelector('link[href="/css/pass-animation.css"]') && document.querySelector('link[href="/css/table-ui.css"]')),
          hasTableActionClass: Boolean(lastButton && lastButton.classList.contains('table-action-btn') && viewTableBtn && viewTableBtn.classList.contains('table-action-btn')),
          hasServerPanel: Boolean(serverPanel),
          hasRoomStatus: Boolean(roomStatus),
          lastButtonFontSize: lastStyle && lastStyle.fontSize,
          lastButtonMinHeight: lastStyle && lastStyle.minHeight,
          resultCardMaxHeight: cardStyle && cardStyle.maxHeight,
          resultScoreOverflowY: scoreStyle && scoreStyle.overflowY,
          resultScoreMinHeight: scoreStyle && scoreStyle.minHeight,
          resultScoreClientHeight: scoreBoard && scoreBoard.clientHeight,
          resultScoreScrollHeight: scoreBoard && scoreBoard.scrollHeight
        });
      }, 1200);
    })`);

    const failures = [];
    if (diagnostics.htmlDevice !== 'mobile') failures.push(`expected mobile screen device, got ${diagnostics.htmlDevice}`);
    if (diagnostics.htmlOrientation !== 'portrait') failures.push(`expected portrait orientation, got ${diagnostics.htmlOrientation}`);
    if (!String(diagnostics.bodyClasses || '').includes('screen-mobile')) failures.push('body is missing screen-mobile class');
    if (!diagnostics.hasSplitStyles) failures.push('split CSS files are not linked');
    if (!diagnostics.hasTableActionClass) failures.push('table action buttons are missing the shared UI class');
    if (diagnostics.hasServerPanel) failures.push('server connection panel should not be rendered');
    if (!diagnostics.hasRoomStatus) failures.push('room status is missing');
    if (diagnostics.lastButtonFontSize !== '11px') failures.push(`unexpected last button font size: ${diagnostics.lastButtonFontSize}`);
    if (diagnostics.lastButtonMinHeight !== '26px') failures.push(`unexpected last button min-height: ${diagnostics.lastButtonMinHeight}`);
    if (diagnostics.resultScoreOverflowY !== 'auto') failures.push(`score board overflow-y is ${diagnostics.resultScoreOverflowY}`);
    if (diagnostics.resultScoreMinHeight !== '0px') failures.push(`score board min-height is ${diagnostics.resultScoreMinHeight}`);
    if (!(diagnostics.resultScoreScrollHeight > diagnostics.resultScoreClientHeight)) failures.push('score board did not become scrollable in the mobile modal sample');

    if (failures.length) throw new Error(`${failures.join('; ')}\n${JSON.stringify(diagnostics, null, 2)}`);
    console.log(`browser check ok ${JSON.stringify(diagnostics)}`);
  } finally {
    try { cdp?.ws?.close(); } catch (error) { /* ignore */ }
    try { chrome.kill(); } catch (error) { /* ignore */ }
    await wait(500);
    await removeDirWithRetry(profileDir);
  }
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
