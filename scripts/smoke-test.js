const WebSocket = require('ws');
const { PUBLIC_DIR } = require('../src/server/config');
const { createStaticFileServer } = require('../src/server/staticFiles');
const { attachRealtimeGame } = require('../src/server/realtimeGame');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function listen(server) {
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

async function fetchOk(port, pathname) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  await response.arrayBuffer();
}

async function fetchText(port, pathname) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  return response.text();
}

function makeClient(port, name, clientId, clients) {
  const client = { name, clientId, roomId: '', state: null, messages: [] };
  client.ws = new WebSocket(`ws://127.0.0.1:${port}`);
  clients.push(client);

  client.ready = new Promise((resolve, reject) => {
    client.ws.once('open', resolve);
    client.ws.once('error', reject);
  });

  client.ws.on('message', raw => {
    const msg = JSON.parse(raw);
    client.messages.push(msg);
    if (msg.type === 'roomCreated') client.roomId = msg.roomId;
    if (msg.type === 'state') {
      client.state = msg;
      client.roomId = msg.roomId || client.roomId;
    }
  });

  client.send = data => client.ws.send(JSON.stringify({ ...data, clientId }));
  client.waitFor = async (predicate, label, timeout = 10_000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (predicate(client)) return client.state;
      await wait(25);
    }
    throw new Error(`${name} timeout: ${label}`);
  };

  return client;
}

async function testHealthAndAssets(port) {
  await fetchOk(port, '/healthz');
  const html = await fetchText(port, '/');
  const assetScript = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  const entryScript = html.includes('src="/js/app.js"') ? '/js/app.js' : assetScript;
  if (!entryScript) throw new Error('No frontend entry script found in index.html');

  for (const path of ['/', '/css/app.css', '/css/pass-animation.css', '/css/table-ui.css', '/css/mobile.css', entryScript, '/sw.js', '/table-bg-v1210.webp']) {
    await fetchOk(port, path);
  }
}

async function testClub2AutoPlay(port) {
  const clients = [];
  try {
    for (let index = 0; index < 4; index += 1) {
      makeClient(port, `P${index + 1}`, `smoke-c2-${Date.now()}-${index}`, clients);
    }

    await Promise.all(clients.map(client => client.ready));

    clients[0].send({ type: 'ping' });
    await clients[0].waitFor(client => client.messages.some(msg => msg.type === 'pong'), 'pong heartbeat');

    clients[0].send({ type: 'createRoom', nickname: 'P1' });
    await clients[0].waitFor(client => Boolean(client.roomId), 'room created');
    const roomId = clients[0].roomId;

    for (let index = 1; index < clients.length; index += 1) {
      clients[index].send({ type: 'joinRoom', roomId, nickname: `P${index + 1}` });
    }

    await Promise.all(clients.map(client => client.waitFor(
      item => item.state && ['pass', 'play'].includes(item.state.phase),
      'pass or play phase'
    )));

    if (clients[0].state.phase === 'pass') {
      for (const client of clients) {
        const hand = client.state.players[client.state.yourIndex].hand;
        const cards = hand.filter(card => card.id !== 'C2').slice(0, 3).map(card => card.id);
        if (cards.length !== 3) throw new Error(`${client.name} could not pick pass cards`);
        client.send({ type: 'passCards', cards });
      }
    }

    await clients[0].waitFor(client => client.state && client.state.phase === 'play', 'play phase');
    await wait(1100);

    const trick = clients[0].state.trick || [];
    const c2Play = trick.find(play => play.card && play.card.id === 'C2');
    if (!c2Play) throw new Error(`C2 was not auto-played; trick=${JSON.stringify(trick)}`);
    if (clients[0].state.currentPlayer === c2Play.player) {
      throw new Error('current player did not advance after C2 auto-play');
    }
  } finally {
    for (const client of clients) {
      try { client.ws.terminate(); } catch (error) { /* ignore */ }
    }
  }
}

async function main() {
  const server = createStaticFileServer({ publicDir: PUBLIC_DIR });
  const game = attachRealtimeGame(server);
  const port = await listen(server);

  try {
    await testHealthAndAssets(port);
    await testClub2AutoPlay(port);
  } finally {
    game.stop();
    server.close();
  }
}

main()
  .then(() => {
    console.log('smoke test ok');
  })
  .catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
