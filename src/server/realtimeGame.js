const WebSocket = require('ws');
const logger = require('./logger');
const { SUITS, RANKS, PASS_NAMES, PASS_DIRS, HUMAN_NICKNAMES, HUMAN_AVATARS, BOT_KINGDOMS, BOT_AVATARS } = require('../shared/constants');
const aiLearning = require('./aiLearning');

function attachRealtimeGame(server) {
  const wss = new WebSocket.Server({ server });

  const WS_MAX_MESSAGE_BYTES = 1024;
  const WS_RATE_LIMIT_COUNT = 10;
  const WS_RATE_LIMIT_WINDOW_MS = 1000;

const ROOM_EMPTY_TTL_MS = Number(process.env.ROOM_EMPTY_TTL_MS || 5 * 60 * 1000);
const ROOM_IDLE_TTL_MS = Number(process.env.ROOM_IDLE_TTL_MS || 60 * 60 * 1000);
const ROOM_SWEEP_INTERVAL_MS = Number(process.env.ROOM_SWEEP_INTERVAL_MS || 30 * 1000);
const OFFLINE_TAKEOVER_MS = Number(process.env.OFFLINE_TAKEOVER_MS || 60 * 1000);
const OFFLINE_TAKEOVER_SWEEP_MS = Number(process.env.OFFLINE_TAKEOVER_SWEEP_MS || 10 * 1000);
const DISCONNECT_GRACE_MS = Number(process.env.DISCONNECT_GRACE_MS || 5 * 1000);

const rooms = new Map();

function buildEasyRoomIdPool() {
  const ids = new Set();

  // 优先使用更好记的“叠数”：AAAA / AABB / ABAB / ABBA。
  for (let a = 1; a <= 9; a += 1) {
    ids.add(`${a}${a}${a}${a}`);
  }

  for (let a = 1; a <= 9; a += 1) {
    for (let b = 0; b <= 9; b += 1) {
      if (a === b) continue;
      ids.add(`${a}${a}${b}${b}`);
      ids.add(`${a}${b}${a}${b}`);
      ids.add(`${a}${b}${b}${a}`);
    }
  }

  return Array.from(ids);
}

const EASY_ROOM_IDS = buildEasyRoomIdPool();

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createRoomId() {
  for (const id of shuffle(EASY_ROOM_IDS)) {
    if (!rooms.has(id)) return id;
  }

  let id;
  do {
    id = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  } while (rooms.has(id));
  return id;
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickHumanAvatar(room = null) {
  const used = new Set((room?.players || []).filter(player => !player.isBot).map(player => player.avatar).filter(Boolean));
  const available = HUMAN_AVATARS.filter(avatar => !used.has(avatar));
  return randomItem(available.length ? available : HUMAN_AVATARS);
}

function pickHumanNickname(room = null) {
  const used = new Set((room?.players || []).map(player => player.name).filter(Boolean));
  const available = HUMAN_NICKNAMES.filter(name => !used.has(name));
  return randomItem(available.length ? available : HUMAN_NICKNAMES);
}

function pickBotIdentity(room = null) {
  const kingdom = randomItem(BOT_AVATARS);
  const used = new Set((room?.players || []).map(player => player.name).filter(Boolean));
  const pool = BOT_KINGDOMS[kingdom] || HUMAN_NICKNAMES;
  const available = pool.filter(name => !used.has(name));
  return { kingdom, name: randomItem(available.length ? available : pool) };
}

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws, message) {
  send(ws, { type: 'error', message });
}

function rankText(rank) {
  if (rank <= 10) return String(rank);
  return { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[rank];
}

function cardName(card) {
  return SUITS[card.suit].name + rankText(card.rank);
}

function makeDeck() {
  const deck = [];
  for (const suit of Object.keys(SUITS)) {
    for (const rank of RANKS) deck.push({ suit, rank, id: suit + rank });
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function sortHand(hand) {
  hand.sort((a, b) => SUITS[a.suit].order - SUITS[b.suit].order || a.rank - b.rank);
}

function isPoint(card) {
  return card.suit === 'H' || (card.suit === 'S' && card.rank === 12);
}

function cardPoints(card) {
  if (card.suit === 'H') return 1;
  if (card.suit === 'S' && card.rank === 12) return 13;
  return 0;
}

function createPlayer({ id, name, ws = null, isBot = false, botIndex = 0, avatar = '', room = null }) {
  const botIdentity = isBot ? pickBotIdentity(room) : null;
  return {
    id,
    name: name || (isBot ? botIdentity.name : pickHumanNickname(room)),
    avatar: avatar || (isBot ? botIdentity.kingdom : pickHumanAvatar(room)),
    ws,
    isBot,
    connected: isBot || Boolean(ws),
    hand: [],
    taken: [],
    round: 0,
    total: 0,
    receivedCards: [],
    receivedFrom: '',
    leftRoom: false,
    takeoverFromId: null,
    takeoverFromName: null,
    takeoverFromAvatar: null,
    takeoverAt: null,
    disconnectedAt: null,
    disconnectGraceTimer: null,
    disconnectGraceStartedAt: null
  };
}

function createRoom(host) {
  const room = {
    id: createRoomId(),
    hostId: host.id,
    players: [host],
    phase: 'lobby',
    roundNo: 1,
    passMode: 0,
    passSelections: [null, null, null, null],
    trick: [],
    trickNo: 0,
    currentPlayer: 0,
    heartsBroken: false,
    busy: false,
    comparingTrick: false,
    collectingTrick: false,
    trickWinnerPlayer: null,
    judgeText: '',
    gameOver: false,
    moonShooter: null,
    eventSeq: 0,
    specialEvents: [],
    interactionSeq: 0,
    interactions: [],
    passFlow: null,
    passFlowSeq: 0,
    lastTrick: null,
    lastAiInteractionKey: '',
    aiMoonGuardInteractionCount: 0,
    timers: [],
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    emptySince: null,
    pendingTakeover: null
  };
  rooms.set(room.id, room);
  return room;
}

function addLog(room, text) {
  room.log.unshift({ round: room.roundNo, text });
  room.log = room.log.slice(0, 200);
}

function addSpecialEvent(room, event) {
  if (!room) return null;
  room.eventSeq = (room.eventSeq || 0) + 1;
  const item = {
    seq: room.eventSeq,
    round: room.roundNo,
    type: event.type || 'event',
    level: event.level || 'minor',
    title: event.title || '牌局事件',
    subtitle: event.subtitle || '',
    player: event.player || '',
    playerIndex: Number.isInteger(event.playerIndex) ? event.playerIndex : null,
    points: Number(event.points || 0),
    at: Date.now()
  };
  room.specialEvents = room.specialEvents || [];
  room.specialEvents.push(item);
  room.specialEvents = room.specialEvents.slice(-10);
  return item;
}


function normalizeInteractionPayload(value) {
  const input = value && typeof value === 'object' ? value : {};
  const allowed = new Map([
    ['emoji', { icon: '💬', label: '表情' }],
    ['flower', { icon: '🌹', label: '送花' }],
    ['tomato', { icon: '🍅', label: '扔番茄' }],
    ['brick', { icon: '🧱', label: '扔砖头' }],
    ['slipper', { icon: '👟', label: '扔拖鞋' }],
    ['cabbage', { icon: '🥬', label: '扔白菜' }],
    ['like', { icon: '❤️', label: '点赞' }],
    ['applause', { icon: '👏', label: '鼓掌' }]
  ]);
  const kind = allowed.has(String(input.kind || '')) ? String(input.kind) : 'emoji';
  const fallback = allowed.get(kind);
  const icon = String(input.icon || fallback.icon).slice(0, 8);
  const label = String(input.label || fallback.label).replace(/[<>]/g, '').slice(0, 16);
  return { kind, icon, label };
}

function addInteraction(room, senderIndex, payload = {}) {
  if (!room || !room.players?.[senderIndex]) return null;
  const info = normalizeInteractionPayload(payload);
  let targetIndex = Number(payload.toIndex);
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex > 3) targetIndex = senderIndex;
  room.interactionSeq = (room.interactionSeq || 0) + 1;
  const sender = room.players[senderIndex];
  const target = room.players[targetIndex] || sender;
  const item = {
    seq: room.interactionSeq,
    round: room.roundNo,
    kind: info.kind,
    icon: info.icon,
    label: info.label,
    fromIndex: senderIndex,
    toIndex: targetIndex,
    from: sender.name || '玩家',
    to: target.name || '玩家',
    at: Date.now()
  };
  room.interactions = room.interactions || [];
  room.interactions.push(item);
  room.interactions = room.interactions.slice(-30);
  addLog(room, `${item.from} 发送互动：${item.label}`);
  return item;
}


function addAIInteraction(room, senderIndex, payload = {}) {
  if (!room || !room.players?.[senderIndex]?.isBot) return null;
  const isTool = ['flower', 'tomato', 'brick', 'slipper', 'cabbage', 'like', 'applause'].includes(payload.kind);
  const toIndex = isTool ? (() => {
    const candidates = room.players
      .map((player, index) => ({ player, index }))
      .filter(item => item.index !== senderIndex && item.player);
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].index : senderIndex;
  })() : senderIndex;
  const key = `${room.roundNo}:${room.trickNo}:${senderIndex}:${toIndex}:${payload.kind || 'emoji'}:${payload.label || ''}`;
  if (room.lastAiInteractionKey === key) return null;
  room.lastAiInteractionKey = key;
  return addInteraction(room, senderIndex, { toIndex, ...payload });
}


const AI_RANDOM_INTERACTIONS = [
  { kind: 'emoji', icon: '👍', label: '干得漂亮' },
  { kind: 'emoji', icon: '😂', label: '哈哈哈' },
  { kind: 'emoji', icon: '⚡', label: '搞快点！搞快点！' },
  { kind: 'emoji', icon: '🛸', label: '小飞棍来喽~' },
  { kind: 'emoji', icon: '😭', label: '家人们，谁懂啊' },
  { kind: 'emoji', icon: '🔍', label: '我要验牌' },
  { kind: 'emoji', icon: '✅', label: '牌没有问题' },
  { kind: 'emoji', icon: '😏', label: '小瘪三' },
  { kind: 'emoji', icon: '🧸', label: '小儿科' },
  { kind: 'emoji', icon: '👞', label: '给我擦皮鞋' },
  { kind: 'like', icon: '❤️', label: '点赞' },
  { kind: 'applause', icon: '👏', label: '鼓掌' },
  { kind: 'flower', icon: '🌹', label: '送花' },
  { kind: 'tomato', icon: '🍅', label: '扔番茄' },
  { kind: 'brick', icon: '🧱', label: '扔砖头' },
  { kind: 'slipper', icon: '👟', label: '扔拖鞋' }
];

function maybeTriggerAIRandomInteraction(room, senderIndex, reason = 'play') {
  const sender = room?.players?.[senderIndex];
  if (!room || !sender?.isBot || room.players.length < 2) return null;
  const now = Date.now();
  if (now - Number(room.lastAIRandomInteractionAt || 0) < 16000) return null;
  const chance = reason === 'roundEnd' ? 0.16 : 0.075;
  if (Math.random() > chance) return null;
  const candidates = room.players
    .map((player, index) => ({ player, index }))
    .filter(item => item.index !== senderIndex && item.player);
  if (!candidates.length) return null;
  const target = candidates[Math.floor(Math.random() * candidates.length)].index;
  const payload = AI_RANDOM_INTERACTIONS[Math.floor(Math.random() * AI_RANDOM_INTERACTIONS.length)];
  room.lastAIRandomInteractionAt = now;
  return addAIInteraction(room, senderIndex, payload);
}

function maybeTriggerAIMoonGuardInteraction(room, senderIndex, threatIndex, mode = 'suspect') {
  if (!room || !room.players?.[senderIndex]?.isBot || !room.players?.[threatIndex]) return null;
  if (senderIndex === threatIndex) return null;
  // v1.4.11：AI 怀疑 / 阻止射月时的自动互动整局最多 3 条，避免刷屏。
  room.aiMoonGuardInteractionCount = Number(room.aiMoonGuardInteractionCount || 0);
  if (room.aiMoonGuardInteractionCount >= 3) return null;
  const variants = mode === 'block'
    ? [
        { kind: 'emoji', icon: '🚨', label: '拦住他' },
        { kind: 'tomato', icon: '🍅', label: '别冲月亮' }
      ]
    : [
        { kind: 'emoji', icon: '🔍', label: '我要验牌' },
        { kind: 'emoji', icon: '🚨', label: '疑似冲月亮' }
      ];
  const info = variants[(Number(room.trickNo || 0) + senderIndex + threatIndex) % variants.length];
  const sent = addAIInteraction(room, senderIndex, info);
  if (sent) room.aiMoonGuardInteractionCount += 1;
  return sent;
}

function maybeTriggerAIInteractionForTrick(room, winnerPlay, points) {
  if (!room?.trick?.length || !winnerPlay) return;
  const queenPlay = room.trick.find(play => play.card?.id === 'S12');
  const winnerIndex = winnerPlay.player;
  if (queenPlay && queenPlay.player !== winnerIndex && room.players[queenPlay.player]?.isBot) {
    addAIInteraction(room, queenPlay.player, { kind: 'tomato', icon: '🍅', label: '接锅啦' });
    return;
  }
  if (points >= 10) {
    const bot = room.players.findIndex((player, index) => player.isBot && index !== winnerIndex);
    if (bot >= 0) addAIInteraction(room, bot, { kind: 'emoji', icon: '😅', label: '大礼包' });
    return;
  }
  if (points === 0 && room.players[winnerIndex]?.isBot && room.trickNo >= 6) {
    const target = room.trick.find(play => play.player !== winnerIndex)?.player ?? winnerIndex;
    addAIInteraction(room, winnerIndex, { kind: 'like', icon: '💙', label: '稳住' });
  }
}

function maybeTriggerAIInteractionForRoundEnd(room, shooter) {
  if (!room?.players?.length) return;
  if (shooter >= 0) {
    const bot = room.players.findIndex((player, index) => player.isBot && index !== shooter);
    if (bot >= 0) addAIInteraction(room, bot, { kind: 'flower', icon: '🌹', label: '射月漂亮' });
    return;
  }
  const zeroIndex = room.players.findIndex(player => player.isBot && Number(player.round || 0) === 0);
  if (zeroIndex >= 0) {
    const target = room.players.findIndex((player, index) => index !== zeroIndex && !player.isBot);
    if (target >= 0) addAIInteraction(room, zeroIndex, { kind: 'applause', icon: '👏', label: '零分过关' });
  }
}

function pointSummary(cards) {
  const hearts = cards.filter(card => card.suit === 'H').length;
  const hasQueen = cards.some(card => card.suit === 'S' && card.rank === 12);
  const parts = [];
  if (hearts) parts.push(`${hearts} 张红桃`);
  if (hasQueen) parts.push('黑桃 Q');
  return parts.join(' + ') || '无分牌';
}

function triggerTrickEvents(room, winnerPlay, points) {
  if (!room?.trick?.length || !winnerPlay) return;
  const winner = room.players[winnerPlay.player]?.name || '玩家';
  const trickCards = room.trick.map(play => play.card);
  const queenPlay = room.trick.find(play => play.card.suit === 'S' && play.card.rank === 12);
  const winnerCard = winnerPlay.card;
  const winnerCardName = cardName(winnerCard);
  const isLastTrick = room.trickNo === 12;

  // 高光：二点吃分。用某个花色的 2 点牌收下分牌时触发。
  if (points > 0 && winnerCard?.rank === 2) {
    addSpecialEvent(room, {
      type: 'twoPointCapture',
      level: 'highlight',
      title: '二点吃分',
      subtitle: `${winner} 用 ${winnerCardName} 收下 ${points} 分。`,
      player: winner,
      playerIndex: winnerPlay.player,
      points
    });
  }

  // 高光：黑桃女王入袋。最后一墩不触发，最后一墩走压轴事件。
  if (queenPlay) {
    if (!isLastTrick) {
      addSpecialEvent(room, {
        type: 'queenCaptured',
        level: 'highlight',
        title: '黑桃女王入袋',
        subtitle: `${winner} 吃下黑桃 Q，+13 分。`,
        player: winner,
        playerIndex: winnerPlay.player,
        points: 13
      });
    } else {
      const queenPlayer = room.players[queenPlay.player]?.name || '玩家';
      const selfEat = queenPlay.player === winnerPlay.player;
      addSpecialEvent(room, {
        type: selfEat ? 'lastQueenSelf' : 'lastQueenThrow',
        level: 'epic',
        title: selfEat ? '压轴自吃' : '压轴甩锅',
        subtitle: selfEat
          ? `${queenPlayer} 最后一墩打出黑桃 Q，却自己收回。`
          : `${queenPlayer} 最后一墩甩出黑桃 Q，${winner} 接锅。`,
        player: selfEat ? queenPlayer : winner,
        playerIndex: selfEat ? queenPlay.player : winnerPlay.player,
        points: 13
      });
    }
  }

  // 名场面：大祸临头。单墩 14-15 分触发。
  if (points >= 14 && points <= 15) {
    addSpecialEvent(room, {
      type: 'disasterTrick',
      level: 'epic',
      title: '大祸临头',
      subtitle: `${winner} 一墩收下 ${points} 分：${pointSummary(trickCards)}。`,
      player: winner,
      playerIndex: winnerPlay.player,
      points
    });
  }

  maybeTriggerAIInteractionForTrick(room, winnerPlay, points);
}

function triggerRoundEndEvents(room, shooter) {
  if (!room?.players?.length) return;
  if (shooter >= 0) {
    const name = room.players[shooter]?.name || '玩家';
    addSpecialEvent(room, {
      type: 'shootMoon',
      level: 'legendary',
      title: '射中月亮',
      subtitle: `${name} 独揽 26 分，全场改命！`,
      player: name,
      playerIndex: shooter,
      points: 26
    });
    maybeTriggerAIInteractionForRoundEnd(room, shooter);
    return;
  }

  const zeroPlayers = room.players
    .map((player, playerIndex) => ({ player, playerIndex }))
    .filter(item => Number(item.player.round || 0) === 0);
  const zeroNames = zeroPlayers.map(item => item.player.name);
  if (zeroNames.length) {
    addSpecialEvent(room, {
      type: 'zeroRound',
      level: 'highlight',
      title: '零分过关',
      subtitle: `${zeroNames.join('、')} 本局完美避分。`,
      player: zeroNames.join('、'),
      playerIndex: zeroPlayers[0]?.playerIndex ?? null
    });
  }

  room.players.forEach((player, playerIndex) => {
    const roundScore = Number(player.round || 0);
    const hearts = (player.taken || []).filter(card => card.suit === 'H').length;

    // 名场面：差点射月。只在 25 分且未射月时触发。
    if (roundScore === 25) {
      addSpecialEvent(room, {
        type: 'nearMoon',
        level: 'epic',
        title: '差点射月',
        subtitle: `${player.name} 本局吃到 25 分，只差一步。`,
        player: player.name,
        playerIndex,
        points: roundScore
      });
    }

    // 名场面：红桃收集者。10 张以上红桃触发。
    if (hearts >= 10) {
      addSpecialEvent(room, {
        type: 'heartCollector',
        level: 'epic',
        title: '红桃收集者',
        subtitle: `${player.name} 收下 ${hearts} 张红桃。`,
        player: player.name,
        playerIndex,
        points: hearts
      });
    }
  });
  maybeTriggerAIInteractionForRoundEnd(room, shooter);
}

function clearRoomTimers(room) {
  for (const timer of room.timers) clearTimeout(timer);
  room.timers = [];
}

function touchRoom(room) {
  if (!room) return;
  room.updatedAt = Date.now();
}

function connectedHumanCount(room) {
  return room.players.filter(player => !player.isBot && player.connected).length;
}

function refreshRoomEmptySince(room) {
  if (!room) return;
  if (connectedHumanCount(room) === 0) {
    if (!room.emptySince) room.emptySince = Date.now();
  } else {
    room.emptySince = null;
  }
}

function closeRoom(room, reason) {
  if (!room || !rooms.has(room.id)) return;
  const message = reason || '房间已自动解散';
  for (const player of room.players) {
    if (!player.isBot && player.ws) {
      send(player.ws, { type: 'roomClosed', roomId: room.id, message });
      try { player.ws.roomId = null; } catch (error) { /* ignore */ }
    }
  }
  clearRoomTimers(room);
  rooms.delete(room.id);
  logger.info(`房间 ${room.id} 已解散：${message}`);
}


function sweepAutoTakeovers() {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (!room || !Array.isArray(room.players)) continue;
    const convertedNames = [];
    const converted = convertHumansToBots(room, player => {
      const shouldTakeover = !player.isBot && !player.connected && !player.leftRoom && player.disconnectedAt && now - player.disconnectedAt >= OFFLINE_TAKEOVER_MS;
      if (shouldTakeover) convertedNames.push(player.name || '玩家');
      return shouldTakeover;
    });
    if (!converted) continue;
    touchRoom(room);
    addLog(room, `${convertedNames.join('、')} 离线超过 1 分钟，已由 AI 自动托管。`);
    broadcast(room);
    if (room.phase === 'pass') maybeCompletePass(room);
    if (room.phase === 'play') {
      scheduleAutoLastCard(room);
      scheduleBot(room);
    }
  }
}

function sweepExpiredRooms() {
  const now = Date.now();
  for (const room of rooms.values()) {
    refreshRoomEmptySince(room);
    if (room.emptySince && now - room.emptySince >= ROOM_EMPTY_TTL_MS) {
      closeRoom(room, '所有真人玩家离线超过时限，房间已自动解散');
      continue;
    }
    if (now - room.updatedAt >= ROOM_IDLE_TTL_MS) {
      closeRoom(room, '房间长时间无操作，已自动解散');
    }
  }
}

function normalizeHost(room) {
  const currentHost = room.players.find(player => player.id === room.hostId);
  if (currentHost && !currentHost.isBot && currentHost.connected && !currentHost.leftRoom) return;
  const nextHost = room.players.find(player => !player.isBot && player.connected && !player.leftRoom);
  if (nextHost) room.hostId = nextHost.id;
}

function findRoomAndIndexByClient(clientId, { includeLeft = true } = {}) {
  for (const room of rooms.values()) {
    const index = room.players.findIndex(player => player.id === clientId && (includeLeft || !player.leftRoom));
    if (index >= 0) return { room, playerIndex: index };
  }
  return null;
}

function publicStateFor(room, viewerIndex) {
  const viewer = room.players[viewerIndex];
  const legal = room.phase === 'play' && room.currentPlayer === viewerIndex && !room.busy
    ? legalCards(room, viewerIndex).map(card => card.id)
    : [];

  return {
    type: 'state',
    roomId: room.id,
    yourIndex: viewerIndex,
    hostId: room.hostId,
    isHost: viewer?.id === room.hostId,
    phase: room.phase,
    roundNo: room.roundNo,
    passMode: room.passMode,
    passName: PASS_NAMES[room.passMode],
    players: room.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      isBot: player.isBot,
      aiControlled: Boolean(player.isBot && player.takeoverFromName),
      connected: player.connected,
      leftRoom: Boolean(player.leftRoom),
      hand: index === viewerIndex ? player.hand : [],
      handCount: player.hand.length,
      round: player.round,
      total: player.total,
      passed: Boolean(room.passSelections[index])
    })),
    trick: room.trick,
    trickNo: room.trickNo,
    currentPlayer: room.currentPlayer,
    heartsBroken: room.heartsBroken,
    busy: room.busy,
    comparingTrick: room.comparingTrick,
    collectingTrick: room.collectingTrick,
    trickWinnerPlayer: room.trickWinnerPlayer,
    judgeText: room.judgeText,
    gameOver: room.gameOver,
    moonShooter: room.moonShooter,
    legalCardIds: legal,
    receivedCards: viewer?.receivedCards || [],
    receivedFrom: viewer?.receivedFrom || '',
    specialEvents: room.specialEvents || [],
    interactions: room.interactions || [],
    passFlow: room.passFlow || null,
    lastTrick: room.lastTrick || null,
    roundTable: ['roundEnd', 'gameEnd'].includes(room.phase) ? (room.roundTable || null) : null,
    log: room.log
  };
}

function broadcast(room) {
  refreshRoomEmptySince(room);
  normalizeHost(room);
  room.players.forEach((player, index) => {
    if (!player.isBot && player.ws) send(player.ws, publicStateFor(room, index));
  });
}

function fillBots(room) {
  while (room.players.length < 4) {
    const identity = pickBotIdentity(room);
    room.players.push(createPlayer({
      id: `bot-${room.id}-${room.players.length}-${Date.now()}` ,
      name: identity.name,
      avatar: identity.kingdom,
      isBot: true,
      botIndex: room.players.length - 1,
      room
    }));
  }
}

function makeBotId(room, index) {
  return `bot-${room.id}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function convertHumansToBots(room, predicate) {
  let converted = 0;
  room.players.forEach((player, index) => {
    if (!player || player.isBot || !predicate(player, index)) return;
    const oldId = player.id;
    const oldName = player.name || `玩家${index + 1}`;
    const oldAvatar = player.avatar || null;
    player.id = makeBotId(room, index);
    player.name = oldName;
    player.avatar = oldAvatar || pickHumanAvatar(room);
    player.isBot = true;
    player.connected = false;
    player.ws = null;
    player.leftRoom = false;
    player.takeoverFromId = oldId;
    player.takeoverFromName = oldName;
    player.takeoverFromAvatar = oldAvatar;
    player.takeoverAt = Date.now();
    if (player.disconnectGraceTimer) clearTimeout(player.disconnectGraceTimer);
    player.disconnectGraceTimer = null;
    player.disconnectGraceStartedAt = null;
    player.disconnectedAt = null;
    player.receivedFrom = player.receivedFrom || '';
    converted++;

    if (room.phase === 'pass' && (!room.passSelections[index] || room.passSelections[index].length !== 3)) {
      room.passSelections[index] = choosePassCards(room, index).map(card => card.id);
    }
  });
  return converted;
}

function convertDisconnectedHumansToBots(room, keepClientId = '') {
  return convertHumansToBots(room, player => (
    !player.isBot &&
    !player.connected &&
    !player.leftRoom &&
    player.id !== keepClientId
  ));
}

function convertLeftHumansToBots(room, keepClientId = '') {
  return convertHumansToBots(room, player => (
    !player.isBot &&
    player.leftRoom &&
    player.id !== keepClientId
  ));
}

function resetHands(room, resetScores = false) {
  for (const player of room.players) {
    player.hand = [];
    player.taken = [];
    player.round = 0;
    player.receivedCards = [];
    player.receivedFrom = '';
    if (resetScores) player.total = 0;
  }
}

function startRound(room, { resetScores = false } = {}) {
  if (room.players.length < 4) return;
  touchRoom(room);
  clearRoomTimers(room);
  resetHands(room, resetScores);

  room.phase = 'deal';
  room.trick = [];
  room.trickNo = 0;
  room.currentPlayer = 0;
  room.heartsBroken = false;
  room.busy = false;
  room.comparingTrick = false;
  room.collectingTrick = false;
  room.trickWinnerPlayer = null;
  room.judgeText = '';
  room.gameOver = false;
  room.moonShooter = null;
  room.specialEvents = [];
  room.passFlow = null;
  room.passFlowSeq = 0;
  room.lastTrick = null;
  room.lastAiInteractionKey = '';
  room.roundTable = null;
  room.lastPassCards = [[], [], [], []];
  room.passSelections = [null, null, null, null];
  if (resetScores) room.aiMoonGuardInteractionCount = 0;

  const deck = shuffle(makeDeck());
  for (let i = 0; i < deck.length; i++) room.players[i % 4].hand.push(deck[i]);
  room.players.forEach(player => sortHand(player.hand));

  room.passMode = (room.roundNo - 1) % 4;
  addLog(room, `第 ${room.roundNo} 局发牌：${PASS_NAMES[room.passMode]}。`);

  broadcast(room);
  room.timers.push(setTimeout(() => finishDeal(room), 2150));
}

function finishDeal(room) {
  if (!room || room.phase !== 'deal') return;

  if (PASS_DIRS[room.passMode] === 0) {
    beginPlay(room);
    return;
  }

  room.phase = 'pass';
  room.players.forEach((player, index) => {
    if (player.isBot) {
      const cards = choosePassCards(room, index);
      room.passSelections[index] = cards.map(card => card.id);
      aiLearning.recordPassDecision(room, index, cards);
    }
  });
  broadcast(room);
  maybeCompletePass(room);
}

function buildRoundTableSnapshot(room) {
  const direction = PASS_DIRS[room.passMode] || 0;
  room.roundTable = {
    roundNo: room.roundNo,
    passMode: room.passMode,
    passName: PASS_NAMES[room.passMode],
    players: room.players.map((player, index) => {
      const passedToIndex = direction ? (index + direction) % 4 : null;
      return {
        index,
        name: player.name,
        avatar: player.avatar,
        round: Number(player.round || 0),
        cards: (player.hand || []).map(card => ({ ...card })),
        receivedCards: (player.receivedCards || []).map(card => ({ ...card })),
        passedCards: ((room.lastPassCards || [])[index] || []).map(card => ({ ...card })),
        passedTo: passedToIndex == null ? '' : (room.players[passedToIndex]?.name || '')
      };
    })
  };
}

function scheduleAutoC2(room) {
  if (room.phase !== 'play' || room.busy) return;
  const playerIndex = room.currentPlayer;
  const player = room.players[playerIndex];
  if (!player) return;
  const c2 = player.hand.find(card => card.id === 'C2');
  if (!c2) return;
  const timer = setTimeout(() => {
    if (room.phase !== 'play' || room.busy) return;
    if (room.currentPlayer !== playerIndex) return;
    const current = room.players[playerIndex];
    if (!current) return;
    const currentC2 = current.hand.find(card => card.id === 'C2');
    if (currentC2) playCard(room, playerIndex, 'C2');
  }, 800);
  room.timers.push(timer);
}

function beginPlay(room) {
  room.phase = 'play';
  room.trick = [];
  room.trickNo = 0;
  room.busy = false;
  room.comparingTrick = false;
  room.collectingTrick = false;
  room.trickWinnerPlayer = null;
  room.judgeText = '';

  buildRoundTableSnapshot(room);

  const starter = room.players.findIndex(player => player.hand.some(card => card.id === 'C2'));
  room.currentPlayer = starter >= 0 ? starter : 0;
  addLog(room, `${room.players[room.currentPlayer].name} 持有梅花2，先出牌。`);
  broadcast(room);
  scheduleAutoC2(room);
}

function countSuit(hand, suit) {
  return hand.filter(card => card.suit === suit).length;
}

function cardDangerValue(card) {
  let score = card.rank;
  if (card.suit === 'S' && card.rank === 12) score += 120;
  if (card.suit === 'S' && card.rank >= 13) score += 46;
  if (card.suit === 'H') score += 22 + card.rank;
  if (card.rank >= 12) score += 10;
  if (card.id === 'C2') score -= 80;
  return score;
}

function playedCards(room) {
  const cards = [];
  for (const player of room.players) cards.push(...(player.taken || []));
  cards.push(...(room.trick || []).map(play => play.card).filter(Boolean));
  return cards;
}

function isQueenSpadesGone(room, playerIndex) {
  const ownHand = room.players[playerIndex]?.hand || [];
  return ownHand.some(card => card.id === 'S12') || playedCards(room).some(card => card.id === 'S12');
}

function suitVoidPlan(hand) {
  const groups = Object.keys(SUITS)
    .map(suit => ({ suit, cards: hand.filter(card => card.suit === suit) }))
    .filter(group => group.cards.length > 0 && group.cards.length <= 3)
    .map(group => {
      const cards = sortDangerHigh(group.cards);
      const danger = cards.reduce((sum, card) => sum + cardDangerValue(card), 0);
      const hasC2 = cards.some(card => card.id === 'C2');
      const hasMeaningfulRisk = cards.some(card => card.id === 'S12' || card.suit === 'H' || card.rank >= 8);
      return { ...group, cards, danger, hasC2, hasMeaningfulRisk };
    })
    .filter(group => !group.hasC2 && group.hasMeaningfulRisk);
  groups.sort((a, b) => a.cards.length - b.cards.length || b.danger - a.danger);
  return groups;
}

function passedCardsWithVoidPlan(room, playerIndex, passScore) {
  const hand = [...(room.players[playerIndex]?.hand || [])];
  const selected = [];
  const selectedIds = new Set();

  for (const group of suitVoidPlan(hand)) {
    if (selected.length + group.cards.length > 3) continue;
    // 黑桃 Q 仍是最高风险牌；如果短门可以顺手传空，优先形成缺门。
    for (const card of group.cards) {
      if (selected.length >= 3) break;
      selected.push(card);
      selectedIds.add(card.id);
    }
    if (selected.length >= 3) break;
  }

  const rest = hand
    .filter(card => !selectedIds.has(card.id))
    .sort((a, b) => passScore(b) - passScore(a) || cardDangerValue(b) - cardDangerValue(a) || b.rank - a.rank);
  for (const card of rest) {
    if (selected.length >= 3) break;
    selected.push(card);
  }
  return selected.slice(0, 3);
}

function choosePassCards(room, playerIndex) {
  const player = room.players[playerIndex];
  const hand = [...player.hand];
  const suitCounts = Object.fromEntries(Object.keys(SUITS).map(suit => [suit, countSuit(hand, suit)]));
  const hasQueenSpades = hand.some(card => card.id === 'S12');
  const moonPattern = hasMoonLaunchPattern(hand);
  const moonLockSuit = moonPattern ? Object.keys(SUITS).find(suit => {
    const ranks = new Set(hand.filter(card => card.suit === suit).map(card => Number(card.rank)));
    return [10, 11, 12, 13, 14].every(rank => ranks.has(rank));
  }) : '';

  const riskBonus = aiLearning.getTrainedWeight('passRiskBonus');
  const voidBonus = aiLearning.getTrainedWeight('passVoidBonus');
  const moonPreserve = aiLearning.getTrainedWeight('passMoonPreserve');

  const passScore = card => {
    let score = cardDangerValue(card);

    if (moonPattern && card.suit === moonLockSuit && card.rank >= 10) score -= 520 * moonPreserve;

    if (card.id === 'S12') score += (moonPattern ? 220 : 700) * riskBonus;
    if (card.suit === 'S' && card.rank >= 13) score += (hasQueenSpades || suitCounts.S <= 4 ? 260 : 120) * riskBonus;

    if (card.suit === 'H' && card.rank >= 11) score += 180 * riskBonus;
    if (card.suit !== 'S' && card.rank === 14) score += 70 * riskBonus;
    if (card.suit !== 'S' && card.rank === 13) score += 45 * riskBonus;

    if (suitCounts[card.suit] > 0 && suitCounts[card.suit] <= 3) {
      score += (4 - suitCounts[card.suit]) * 34 * voidBonus;
      if (card.rank >= 10) score += 26 * voidBonus;
    }

    if (!isPoint(card) && card.rank <= 5) score -= 34;
    if (card.id === 'C2') score -= 120;
    return score;
  };

  return passedCardsWithVoidPlan(room, playerIndex, passScore);
}

function removeCardsByIds(hand, ids) {
  const removed = [];
  for (const id of ids) {
    const index = hand.findIndex(card => card.id === id);
    if (index < 0) return null;
    removed.push(hand[index]);
  }
  for (const card of removed) {
    const index = hand.findIndex(item => item.id === card.id);
    if (index >= 0) hand.splice(index, 1);
  }
  return removed;
}

function submitPass(room, playerIndex, cardIds) {
  if (room.phase !== 'pass') return '现在不是传牌阶段';
  if (!Array.isArray(cardIds) || cardIds.length !== 3) return '必须选择 3 张牌';
  if (new Set(cardIds).size !== 3) return '传牌不能重复选择同一张牌';
  const player = room.players[playerIndex];
  if (!player) return '玩家不存在';
  if (!cardIds.every(id => player.hand.some(card => card.id === id))) return '选择的牌不在你的手牌中';

  touchRoom(room);
  room.passSelections[playerIndex] = cardIds;
  addLog(room, `${player.name} 已选择 3 张传牌。`);
  broadcast(room);
  maybeCompletePass(room);
  return null;
}

function maybeCompletePass(room) {
  if (room.phase !== 'pass') return;
  if (!room.passSelections.every(selection => Array.isArray(selection) && selection.length === 3)) return;

  const direction = PASS_DIRS[room.passMode];
  const passCards = room.passSelections.map((ids, index) => {
    return ids.map(id => room.players[index].hand.find(card => card.id === id)).filter(Boolean);
  });
  room.lastPassCards = passCards.map(cards => cards.map(card => ({ ...card })));

  if (passCards.some(cards => cards.length !== 3)) {
    addLog(room, '传牌失败：有玩家选择的牌已经不存在。');
    room.passSelections = [null, null, null, null];
    broadcast(room);
    return;
  }

  for (let i = 0; i < 4; i++) removeCardsByIds(room.players[i].hand, room.passSelections[i]);
  for (let i = 0; i < 4; i++) {
    const receiverIndex = (i + direction) % 4;
    room.players[receiverIndex].hand.push(...passCards[i]);
  }

  for (let receiver = 0; receiver < 4; receiver++) {
    const sender = (receiver - direction + 4) % 4;
    room.players[receiver].receivedCards = [...passCards[sender]];
    room.players[receiver].receivedFrom = room.players[sender].name;
    sortHand(room.players[receiver].hand);
  }

  room.passFlowSeq = Number(room.passFlowSeq || 0) + 1;
  room.passFlow = {
    seq: room.passFlowSeq,
    roundNo: room.roundNo,
    passMode: room.passMode,
    flows: room.players.map((_, sender) => ({
      from: sender,
      to: (sender + direction) % 4,
      count: 3
    }))
  };

  room.passSelections = [null, null, null, null];
  addLog(room, `传牌完成：${PASS_NAMES[room.passMode]}。`);
  aiLearning.recordPassOutcome(room);
  beginPlay(room);
}

function legalCards(room, playerIndex) {
  const hand = room.players[playerIndex].hand;
  const firstTrick = room.trickNo === 0;

  if (room.trick.length === 0) {
    if (firstTrick) return hand.filter(card => card.id === 'C2');
    const nonHearts = hand.filter(card => card.suit !== 'H');
    if (!room.heartsBroken && nonHearts.length > 0) return nonHearts;
    return hand;
  }

  const leadSuit = room.trick[0].card.suit;
  const followCards = hand.filter(card => card.suit === leadSuit);
  if (followCards.length > 0) return followCards;

  if (firstTrick) {
    const safeCards = hand.filter(card => !isPoint(card));
    return safeCards.length ? safeCards : hand;
  }

  return hand;
}

function currentWinningPlay(room) {
  const leadSuit = room.trick[0].card.suit;
  return room.trick
    .filter(play => play.card.suit === leadSuit)
    .sort((a, b) => b.card.rank - a.card.rank)[0];
}

function sortLow(cards) {
  return [...cards].sort((a, b) => a.rank - b.rank || SUITS[a.suit].order - SUITS[b.suit].order);
}

function sortHigh(cards) {
  return [...cards].sort((a, b) => b.rank - a.rank || SUITS[b.suit].order - SUITS[a.suit].order);
}

function sortDangerHigh(cards) {
  return [...cards].sort((a, b) => cardDangerValue(b) - cardDangerValue(a) || b.rank - a.rank);
}

function trickPoints(room) {
  return (room.trick || []).reduce((sum, play) => sum + cardPoints(play.card), 0);
}

function roundPointsSoFar(room) {
  return (room.players || []).reduce((sum, player) => sum + Number(player.round || 0), 0) + trickPoints(room);
}

function findMoonThreat(room, playerIndex) {
  const totalKnownPoints = roundPointsSoFar(room);
  let best = null;
  for (let i = 0; i < room.players.length; i += 1) {
    if (i === playerIndex) continue;
    if (!moonStillAchievable(room, i)) continue;
    const score = Number(room.players[i].round || 0);
    const clientId = room.players[i]?.id;
    const adjusted = aiLearning.adjustMoonThreatForOpponent(clientId, { playerIndex: i, score });
    if (!adjusted) continue;
    // 仅用公开分数判断：当某家已经吃下大多数分牌，或接近 26 分时，视为射月威胁。
    const hasMostPublicPoints = score >= 13 && totalKnownPoints > 0 && score >= totalKnownPoints - 2;
    const isNearMoon = score >= 18;
    if ((hasMostPublicPoints || isNearMoon) && (!best || score > best.score)) best = { playerIndex: i, score };
  }
  return best;
}

function ownPublicControlScore(hand) {
  return (hand || []).reduce((sum, card) => {
    let value = 0;
    if (card.rank >= 13) value += 2;
    else if (card.rank === 12) value += 1;
    if (card.suit === 'H' && card.rank >= 10) value += 2;
    if (card.id === 'S12') value += 2;
    if (card.suit === 'S' && card.rank >= 13) value += 1;
    return sum + value;
  }, 0);
}

function hasMoonLaunchPattern(hand) {
  const cards = hand || [];
  const lockSuit = Object.keys(SUITS).find(suit => {
    const ranks = new Set(cards.filter(card => card.suit === suit).map(card => Number(card.rank)));
    return [10, 11, 12, 13, 14].every(rank => ranks.has(rank));
  });
  if (!lockSuit) return false;
  const outsideKingsAces = cards.filter(card => card.suit !== lockSuit && Number(card.rank) >= 13).length;
  const heartControl = cards.filter(card => card.suit === 'H' && Number(card.rank) >= 10).length;
  return outsideKingsAces >= 2 || (lockSuit === 'H' && outsideKingsAces >= 1) || heartControl >= 4;
}

function suitLedBefore(room, suit) {
  if (!suit) return false;
  const history = playedCards(room).filter(card => card && card.suit === suit);
  const current = (room.trick || []).filter(play => play.card?.suit === suit).length;
  return history.length > current;
}

function firstRoundHighDump(room, playerIndex, leadSuit, follows, pointsOnTable) {
  if (!Array.isArray(follows) || !follows.length || pointsOnTable) return null;
  const hand = room.players[playerIndex]?.hand || [];
  // 首墩梅花 2 开局不能出分牌，跟梅花时可以积极甩掉最大梅花，减少后续吃牌权风险。
  if (room.trickNo === 0 && leadSuit === 'C') return sortHigh(follows)[0];
  // 方片首次被领出且自己方片不多时，同样优先释放大方片；方片很多则保留小牌控节奏。
  if (leadSuit === 'D' && !suitLedBefore(room, 'D')) {
    const diamondCount = countSuit(hand, 'D');
    if (diamondCount > 0 && diamondCount <= 4) return sortHigh(follows)[0];
  }
  return null;
}


function smallSafeOtherSuitLead(room, legal) {
  const previousSuit = room.lastTrick?.leadSuit || '';
  const safe = sortLow((legal || []).filter(card => !isPoint(card) && card.rank <= 5));
  const other = safe.filter(card => !previousSuit || card.suit !== previousSuit);
  return other[0] || null;
}

function lowHeartLeadForTempo(room, legal) {
  if (!room.heartsBroken || room.trickNo > 5) return null;
  const lowHearts = sortLow((legal || []).filter(card => card.suit === 'H' && card.rank <= 4));
  return lowHearts[0] || null;
}

function shouldAvoidRepeatMaxSuit(room, candidates) {
  const last = room.lastTrick;
  if (!last || !last.leadSuit || !Array.isArray(candidates) || !candidates.length) return false;
  const sameSuit = candidates.filter(card => card.suit === last.leadSuit);
  if (!sameSuit.length) return false;
  const lowSame = sortLow(sameSuit)[0];
  if (!lowSame) return false;
  // 如果上一墩该花色已经被较大牌拿下，而自己现在同花色只剩高张，优先尝试其他 2/3/4/5 小牌，不急着重新把牌权拿回来。
  return lowSame.rank >= Math.max(10, Number(last.winningRank || 0));
}

function moonStillAchievable(room, playerIndex) {
  return !(room.players || []).some((p, i) => i !== playerIndex && Number(p.round || 0) > 0);
}

function shouldTryShootMoon(room, playerIndex, legal) {
  if (!moonStillAchievable(room, playerIndex)) return false;
  const player = room.players[playerIndex];
  const roundScore = Number(player.round || 0);
  const hand = player.hand || [];
  const controlScore = ownPublicControlScore(hand);
  const legalCanCollect = (legal || []).some(card => card.rank >= 12 || isPoint(card));
  const moonPattern = hasMoonLaunchPattern(hand);
  // 高手射月：当某一花色 10/J/Q/K/A 齐全且其它花色仍有两张以上 K/A 时，可从前中期主动尝试吃分。
  let moonDecision = false;
  if (moonPattern && (legalCanCollect || room.trickNo <= 4 || roundScore >= 4)) moonDecision = true;
  // 保守射月：只有自己已经吃到不少分，且手中仍有明显控牌能力时才继续推进。
  if (roundScore >= 20) moonDecision = controlScore >= 4 && legalCanCollect;
  else if (roundScore >= 15) moonDecision = controlScore >= 7 && legalCanCollect;
  else if (roundScore >= 10 && moonPattern) moonDecision = controlScore >= 5;
  return aiLearning.shouldPreferMoon(moonDecision, controlScore);
}

function chooseLeadCard(room, playerIndex, legal, shootMoon) {
  const low = sortLow(legal);
  const high = sortHigh(legal);

  if (shootMoon) {
    const pointLead = sortHigh(legal.filter(card => card.suit === 'H' || card.id === 'S12'))[0];
    if (pointLead && (room.heartsBroken || pointLead.suit !== 'H')) return pointLead;
    return high[0];
  }

  const queenGone = isQueenSpadesGone(room, playerIndex);
  const safe = low.filter(card => {
    if (isPoint(card)) return false;
    if (card.suit === 'S' && card.rank >= 12 && !queenGone) return false;
    return true;
  });

  const candidates = safe.length ? safe : low.filter(card => !isPoint(card));
  if (candidates.length) {
    const smallOther = smallSafeOtherSuitLead(room, candidates);
    if (smallOther && (room.trickNo <= 4 || shouldAvoidRepeatMaxSuit(room, candidates))) return smallOther;

    const tempoHeart = lowHeartLeadForTempo(room, legal);
    if (tempoHeart && candidates.every(card => card.rank > 5 || card.suit === 'H')) return tempoHeart;

    // 高手风格：优先从长门出低张，减少被迫收分；短门保留给后续垫分/避分。
    const suitGroups = Object.keys(SUITS)
      .map(suit => ({ suit, cards: candidates.filter(card => card.suit === suit) }))
      .filter(group => group.cards.length);
    suitGroups.sort((a, b) => b.cards.length - a.cards.length || sortLow(a.cards)[0].rank - sortLow(b.cards)[0].rank);
    return sortLow(suitGroups[0].cards)[0];
  }

  const tempoHeart = lowHeartLeadForTempo(room, legal);
  if (tempoHeart && !shootMoon) return tempoHeart;
  return low[0] || high[0];
}

function chooseAICard(room, playerIndex) {
  const legal = legalCards(room, playerIndex);
  if (!legal.length) return null;
  const firstTrick = room.trickNo === 0;
  const c2 = legal.find(card => card.id === 'C2');
  if (firstTrick && c2) return c2;

  const low = sortLow(legal);
  const high = sortHigh(legal);
  const shootMoon = shouldTryShootMoon(room, playerIndex, legal);
  const moonThreat = findMoonThreat(room, playerIndex);
  if (moonThreat && room.players[playerIndex]?.isBot) {
    maybeTriggerAIMoonGuardInteraction(room, playerIndex, moonThreat.playerIndex, 'suspect');
  }

  if (room.players[playerIndex]?.isBot) {
    if (!room._aiStrategies) room._aiStrategies = {};
    room._aiStrategies[playerIndex] = {
      moonAttempt: !!shootMoon,
      moonBlocked: !!(moonThreat && room.trick.length > 0),
      phase: room.trickNo <= 4 ? 'early' : room.trickNo <= 9 ? 'mid' : 'late',
    };
  }

  if (room.trick.length === 0) {
    return chooseLeadCard(room, playerIndex, legal, shootMoon);
  }

  const leadSuit = room.trick[0].card.suit;
  const follows = legal.filter(card => card.suit === leadSuit);
  const winningPlay = currentWinningPlay(room);
  const currentWinner = winningPlay?.player;
  const currentWinningCard = winningPlay?.card;
  const pointsOnTable = trickPoints(room) > 0;
  const isLastToAct = room.trick.length === 3;

  if (follows.length) {
    const under = sortHigh(follows.filter(card => card.rank < currentWinningCard.rank));
    const over = sortLow(follows.filter(card => card.rank > currentWinningCard.rank));
    const firstDump = firstRoundHighDump(room, playerIndex, leadSuit, follows, pointsOnTable);
    if (firstDump && !shootMoon) return firstDump;

    if (shootMoon) {
      if (over.length) return sortLow(over)[0];
      return sortHigh(follows)[0] || high[0];
    }

    // 防射月：若威胁玩家正在赢本墩，AI 会在合法范围内主动用最小大牌截胡，并触发互动提醒。
    if (moonThreat && currentWinner === moonThreat.playerIndex && over.length) {
      maybeTriggerAIMoonGuardInteraction(room, playerIndex, moonThreat.playerIndex, 'block');
      return over[0];
    }

    if (under.length) {
      // 非首家跟牌：若当前最大只是 10，则 9/8/7 属于本墩安全张，可优先打出，保留 2-6 以后接牌。
      if (!pointsOnTable && currentWinningCard?.rank === 10 && !moonThreat) {
        const safeBelowTen = sortHigh(under.filter(card => card.rank >= 7 && card.rank <= 9));
        if (safeBelowTen.length) return safeBelowTen[0];
      }
      // 有分时压在最大牌下面并顺手处理高危牌；无分时也趁安全释放 Q/K/A，不把大牌机械留到后期吃大分。
      if (pointsOnTable) return sortDangerHigh(under)[0];
      const safeDump = sortDangerHigh(under.filter(card => card.rank >= 12 || (card.suit === 'S' && card.rank >= 11)))[0];
      return safeDump || under[0];
    }

    // 不得不赢时，用最小能赢的牌；末位且无分可适度拿牌权，避免一直被动。
    if (over.length) {
      // 必赢局面：当局面已经是"怎么接都是自己最大"时，优先出最大的牌来甩掉高危牌。
      // 例外：若当前无分且有对手疑似冲击月亮，则不甩大牌，优先阻止射月。
      const isGuaranteedWin = isLastToAct || over[over.length - 1].rank >= 14;
      if (isGuaranteedWin && !(!pointsOnTable && moonThreat)) {
        return sortHigh(over)[0];
      }
      if (isLastToAct && !pointsOnTable && over[0].rank <= 10) return over[0];
      return over[0];
    }
    return low[0];
  }

  if (shootMoon) {
    const point = sortHigh(legal.filter(card => isPoint(card)))[0];
    return point || high[0];
  }

  // 缺门时优先甩危险牌；但若当前赢家疑似射月，则尽量不继续喂分。
  if (moonThreat && currentWinner === moonThreat.playerIndex) {
    const safe = sortHigh(legal.filter(card => !isPoint(card)))[0];
    if (safe) return safe;
    return sortLow(legal)[0];
  }

  const queenSpades = legal.find(card => card.suit === 'S' && card.rank === 12);
  if (queenSpades && !firstTrick) return queenSpades;

  const highDanger = sortDangerHigh(legal.filter(card => !isPoint(card) && (card.rank >= 12 || card.suit === 'S')))[0];
  const highHearts = sortHigh(legal.filter(card => card.suit === 'H' && card.rank >= 8));
  if (!firstTrick) {
    // 缺门时优先甩真正危险的大牌；红桃小牌可留 1-2 张，后续用来垫缺门或压低风险。
    if (highDanger && (!highHearts.length || cardDangerValue(highDanger) >= cardDangerValue(highHearts[0]) - 8)) return highDanger;
    if (highHearts.length) return highHearts[0];
  }

  const remainingDanger = sortDangerHigh(legal.filter(card => !isPoint(card)))[0];
  if (remainingDanger) return remainingDanger;

  // 末位且本墩已有分，能垫低分时避免额外加大风险。
  if (isLastToAct && pointsOnTable) return low[0];
  return high[0] || low[0];
}

function getTrickWinnerPlay(room) {
  if (!room.trick.length) return null;
  const leadSuit = room.trick[0].card.suit;
  return room.trick
    .filter(play => play.card.suit === leadSuit)
    .sort((a, b) => b.card.rank - a.card.rank)[0];
}

function removeCardById(hand, cardId) {
  const index = hand.findIndex(card => card.id === cardId);
  if (index < 0) return null;
  return hand.splice(index, 1)[0];
}

function playCard(room, playerIndex, cardId) {
  if (room.phase !== 'play') return '现在不是出牌阶段';
  if (room.busy) return '正在结算本墩，请稍等';
  if (room.currentPlayer !== playerIndex) return '还没轮到你出牌';

  const player = room.players[playerIndex];
  const legal = legalCards(room, playerIndex);
  if (!legal.some(card => card.id === cardId)) return '这张牌现在不能出';

  const card = removeCardById(player.hand, cardId);
  if (!card) return '这张牌不在你的手牌中';

  touchRoom(room);
  const wasHeartsBroken = room.heartsBroken;
  room.trick.push({ player: playerIndex, card });
  if (card.suit === 'H') {
    room.heartsBroken = true;
    if (!wasHeartsBroken) {
      addSpecialEvent(room, {
        type: 'heartsBroken',
        level: 'minor',
        title: '红桃已破',
        subtitle: `${player.name} 打出第一张红桃，现在可以主动出红桃了。`,
        player: player.name,
        playerIndex
      });
    }
  }
  addLog(room, `${player.name} 出 ${cardName(card)}。`);
  maybeTriggerAIRandomInteraction(room, playerIndex, 'play');

  if (room.trick.length < 4) {
    room.currentPlayer = (playerIndex + 1) % 4;
    broadcast(room);
    scheduleAutoLastCard(room);
    scheduleBot(room);
    return null;
  }

  startTrickJudge(room);
  return null;
}

function startTrickJudge(room) {
  const winnerPlay = getTrickWinnerPlay(room);
  const leadSuit = room.trick[0].card.suit;
  const points = room.trick.reduce((sum, play) => sum + cardPoints(play.card), 0);

  room.busy = true;
  room.comparingTrick = true;
  room.collectingTrick = false;
  room.trickWinnerPlayer = winnerPlay.player;
  room.judgeText = ''; // v1.3.13：不显示文字收墩播报，保留最大牌高亮，并用方向性整叠收牌动画。
  triggerTrickEvents(room, winnerPlay, points);
  broadcast(room);

  room.timers.push(setTimeout(() => {
    room.collectingTrick = true;
    broadcast(room);
  }, 900));

  // v1.3.17：收墩飞行动画由前端克隆层继续播放；牌合并并开始飞行后，即可进入下一墩。
  room.timers.push(setTimeout(() => resolveTrick(room), 1720));
}

function resolveTrick(room) {
  if (room.trick.length !== 4) return;

  const winnerPlay = getTrickWinnerPlay(room);
  const points = room.trick.reduce((sum, play) => sum + cardPoints(play.card), 0);

  const completedTrick = room.trick.map(play => ({ player: play.player, card: { ...play.card } }));
  const leadSuit = completedTrick[0]?.card?.suit || '';
  room.players[winnerPlay.player].taken.push(...room.trick.map(play => play.card));
  room.players[winnerPlay.player].round += points;
  room.lastTrick = {
    leadSuit,
    leaderPlayer: completedTrick[0]?.player ?? null,
    winnerPlayer: winnerPlay.player,
    winningRank: Number(winnerPlay.card?.rank || 0),
    points,
    cards: completedTrick
  };
  addLog(room, `第 ${room.trickNo + 1} 墩：${room.players[winnerPlay.player].name} 收墩，最大牌 ${cardName(winnerPlay.card)}，得到 ${points} 分。`);

  room.trick = [];
  room.trickNo++;
  room.currentPlayer = winnerPlay.player;
  room.busy = false;
  room.comparingTrick = false;
  room.collectingTrick = false;
  room.trickWinnerPlayer = null;
  room.judgeText = '';

  if (room.trickNo >= 13) finishRound(room);
  else {
    broadcast(room);
    scheduleAutoLastCard(room);
    scheduleBot(room);
  }
}

function finishRound(room) {
  room.phase = 'roundEnd';
  room.busy = false;
  const shooter = room.players.findIndex(player => player.round === 26);
  room.moonShooter = shooter >= 0 ? shooter : null;

  triggerRoundEndEvents(room, shooter);

  if (shooter >= 0) {
    addLog(room, `${room.players[shooter].name} 打满贯！其他三家各加 26 分。`);
    for (let i = 0; i < 4; i++) room.players[i].total += i === shooter ? 0 : 26;
  } else {
    for (const player of room.players) player.total += player.round;
  }

  if (room.roundTable?.players) {
    room.roundTable.players.forEach((row, index) => {
      row.round = Number(room.players[index]?.round || 0);
      row.total = Number(room.players[index]?.total || 0);
    });
  }

  // ── AI 自学习：记录本轮策略结果 ──
  const strategies = room._aiStrategies || {};
  for (let i = 0; i < room.players.length; i += 1) {
    const p = room.players[i];
    if (!p.isBot) continue;
    const st = strategies[i];
    if (st && st.moonAttempt) {
      const moonSuccess = shooter === i;
      aiLearning.recordStrategyOutcome('moon_attempt', moonSuccess, moonSuccess ? 0 : p.round);
    }
    if (st && st.moonBlocked) {
      const blockedSomeone = shooter >= 0 && shooter !== i && room.players[shooter].round === 26;
      aiLearning.recordStrategyOutcome('block_moon', blockedSomeone, 0);
    }
    aiLearning.recordStrategyOutcome(`lead_${st?.phase || 'mid'}`, p.round <= 3, -p.round);
  }
  for (let i = 0; i < room.players.length; i += 1) {
    const p = room.players[i];
    if (p.isBot) continue;
    const clientId = p.id;
    if (!clientId) continue;
    const didMoonAttempt = shooter === i;
    aiLearning.recordOpponentRound(clientId, {
      moonAttempt: didMoonAttempt,
      moonSuccess: didMoonAttempt,
      aggressive: p.round >= 10,
      defensive: p.round <= 2,
      points: p.round,
    });
  }
  delete room._aiStrategies;

  if (Math.max(...room.players.map(player => player.total)) >= 100) {
    room.phase = 'gameEnd';
    room.gameOver = true;
    const minScore = Math.min(...room.players.map(player => player.total));
    const winners = room.players.filter(player => player.total === minScore).map(player => player.name).join('、');
    addLog(room, `游戏结束：${winners} 获胜。`);
    aiLearning.recordGame(room);
  } else {
    addLog(room, `第 ${room.roundNo} 局结束。`);
  }
  const roundEndBot = room.players.findIndex(player => player?.isBot);
  if (roundEndBot >= 0) maybeTriggerAIRandomInteraction(room, roundEndBot, 'roundEnd');

  broadcast(room);
}

function scheduleAutoLastCard(room) {
  if (room.phase !== 'play' || room.busy) return false;
  const playerIndex = room.currentPlayer;
  const player = room.players[playerIndex];
  if (!player || (player.hand || []).length !== 1) return false;
  const legal = legalCards(room, playerIndex);
  if (legal.length !== 1) return false;
  const cardId = legal[0].id;
  const timer = setTimeout(() => {
    if (room.phase !== 'play' || room.busy) return;
    if (room.currentPlayer !== playerIndex) return;
    const current = room.players[playerIndex];
    if (!current || (current.hand || []).length !== 1) return;
    const currentLegal = legalCards(room, playerIndex);
    if (currentLegal.length === 1 && currentLegal[0].id === cardId) playCard(room, playerIndex, cardId);
  }, 520);
  room.timers.push(timer);
  return true;
}

function scheduleBot(room) {
  if (room.phase !== 'play' || room.busy) return;
  const player = room.players[room.currentPlayer];
  if (!player || !player.isBot) return;

  const timer = setTimeout(() => {
    if (room.phase !== 'play' || room.busy) return;
    if (!room.players[room.currentPlayer]?.isBot) return;
    const card = chooseAICard(room, room.currentPlayer);
    if (card) playCard(room, room.currentPlayer, card.id);
  }, 1700 + Math.floor(Math.random() * 450));
  room.timers.push(timer);
}

function getRoomForSocket(ws) {
  if (!ws.roomId) return null;
  return rooms.get(ws.roomId) || null;
}

function findSocketByClientId(room, clientId) {
  if (!room) return null;
  const player = room.players.find(p => p.id === clientId && !p.isBot);
  return player?.ws || null;
}

function attachSocketToPlayer(ws, room, playerIndex) {
  const player = room.players[playerIndex];
  if (!player || player.isBot) return false;
  if (player.ws && player.ws !== ws) {
    try { player.ws.close(); } catch (error) { /* ignore */ }
  }
  if (player.disconnectGraceTimer) clearTimeout(player.disconnectGraceTimer);
  player.disconnectGraceTimer = null;
  player.disconnectGraceStartedAt = null;
  player.ws = ws;
  player.connected = true;
  player.disconnectedAt = null;
  player.leftRoom = false;
  room.emptySince = null;
  touchRoom(room);
  ws.roomId = room.id;
  ws.playerIndex = playerIndex;
  ws.clientId = player.id;
  return true;
}

function canHost(ws, room) {
  const player = room.players[ws.playerIndex];
  return player && player.id === room.hostId;
}

function normalizeNickname(name) {
  const input = String(name || '').trim();
  let units = 0;
  let output = '';
  for (const char of Array.from(input)) {
    const unit = /[\x00-\xff]/.test(char) ? 1 : 2;
    if (units + unit > 20) break;
    output += char;
    units += unit;
  }
  return output;
}

function replaceTakeoverBotWithHuman(ws, room, botIndex, clientId, nickname) {
  const player = room.players[botIndex];
  if (!player || !player.isBot || !player.takeoverFromName) return false;
  const oldBotId = player.id;
  player.id = clientId;
  player.name = player.takeoverFromName || nickname || '玩家';
  player.avatar = player.takeoverFromAvatar || pickHumanAvatar(room);
  if (player.disconnectGraceTimer) clearTimeout(player.disconnectGraceTimer);
  player.disconnectGraceTimer = null;
  player.disconnectGraceStartedAt = null;
  player.ws = null;
  player.isBot = false;
  player.connected = false;
  player.disconnectedAt = null;
  player.leftRoom = false;
  player.takeoverFromId = null;
  player.takeoverFromName = null;
  player.takeoverFromAvatar = null;
  player.takeoverAt = null;

  if (room.hostId === oldBotId) room.hostId = player.id;
  attachSocketToPlayer(ws, room, botIndex);

  if (room.phase === 'pass' && room.passSelections[botIndex]) {
    room.passSelections[botIndex] = null;
  }

  touchRoom(room);
  addLog(room, `${player.name} 已重新加入，并取代 AI 接管座位。`);
  broadcast(room);
  return true;
}

function handleMessage(ws, msg) {
  if (msg.type === 'hello') {
    ws.clientId = String(msg.clientId || '');
    const roomId = typeof msg.roomId === 'string' ? msg.roomId.trim() : '';
    const room = rooms.get(roomId);
    if (room) {
      let index = room.players.findIndex(player => player.id === ws.clientId && !player.isBot);
      if (index < 0) {
        const botIndex = room.players.findIndex(player => player.id === ws.clientId && player.isBot);
        if (botIndex >= 0) {
          replaceTakeoverBotWithHuman(ws, room, botIndex, ws.clientId, '');
          return;
        }
      }
      if (index >= 0) {
        attachSocketToPlayer(ws, room, index);
        addLog(room, `${room.players[index].name} 已重新连接。`);
        broadcast(room);
      }
    }
    return;
  }

  if (msg.type === 'createRoom') {
    const clientId = String(msg.clientId || ws.clientId || `client-${Date.now()}-${Math.random()}`);
    const existing = findRoomAndIndexByClient(clientId, { includeLeft: false });
    if (existing && existing.room.phase !== 'gameEnd') {
      attachSocketToPlayer(ws, existing.room, existing.playerIndex);
      send(ws, { type: 'roomCreated', roomId: existing.room.id });
      broadcast(existing.room);
      return;
    }

    const host = createPlayer({
      id: clientId,
      name: normalizeNickname(msg.nickname || '') || pickHumanNickname(),
      ws,
      avatar: pickHumanAvatar()
    });
    const room = createRoom(host);
    attachSocketToPlayer(ws, room, 0);
    addLog(room, `${host.name} 创建了房间。`);
    send(ws, { type: 'roomCreated', roomId: room.id });
    broadcast(room);
    return;
  }

  if (msg.type === 'joinRoom') {
    const roomId = String(msg.roomId || '').trim();
    if (!/^\d{4}$/.test(roomId)) return sendError(ws, '请输入 4 位数字房间号');
    const room = rooms.get(roomId);
    if (!room) return sendError(ws, '房间不存在或已超时解散');

    const clientId = String(msg.clientId || ws.clientId || `client-${Date.now()}-${Math.random()}`);
    const nickname = normalizeNickname(msg.nickname || '') || pickHumanNickname(room);
    const existingIndex = room.players.findIndex(player => player.id === clientId && !player.isBot);
    if (existingIndex >= 0) {
      attachSocketToPlayer(ws, room, existingIndex);
      addLog(room, `${room.players[existingIndex].name} 已重新加入房间。`);
      broadcast(room);
      return;
    }

    const takeoverIndex = room.players.findIndex(player =>
      player.isBot &&
      player.takeoverFromName &&
      normalizeNickname(player.takeoverFromName) === nickname
    );
    if (takeoverIndex >= 0) {
      room.pendingTakeover = {
        clientId,
        nickname,
        botIndex: takeoverIndex,
        botName: room.players[takeoverIndex].name,
        requestedAt: Date.now()
      };
      send(ws, { type: 'takeoverRequested', roomId: room.id, botName: room.players[takeoverIndex].name });
      const hostWs = room.players.find(p => p.id === room.hostId)?.ws;
      if (hostWs) {
        send(hostWs, { type: 'takeoverApprovalNeeded', roomId: room.id, nickname, botName: room.players[takeoverIndex].name, botIndex: takeoverIndex });
      }
      addLog(room, `${nickname} 请求接管 AI「${room.players[takeoverIndex].name}」的牌局，等待房主批准。`);
      broadcast(room);
      return;
    }

    if (!['lobby'].includes(room.phase)) return sendError(ws, '牌局已经开始，仅原玩家或被 AI 接管的玩家可重新加入');
    if (room.players.length >= 4) return sendError(ws, '房间已满');

    const player = createPlayer({
      id: clientId,
      name: nickname,
      ws,
      avatar: pickHumanAvatar(room),
      room
    });
    room.players.push(player);
    touchRoom(room);
    attachSocketToPlayer(ws, room, room.players.length - 1);
    addLog(room, `${player.name} 加入了房间。`);

    if (room.players.length === 4) startRound(room);
    else broadcast(room);
    return;
  }

  const room = getRoomForSocket(ws);
  if (!room) return sendError(ws, '请先创建或加入房间');

  if (msg.type === 'leaveRoom') {
    const player = room.players[ws.playerIndex];
    if (player && !player.isBot && player.ws === ws) {
      if (player.disconnectGraceTimer) clearTimeout(player.disconnectGraceTimer);
      player.disconnectGraceTimer = null;
      player.disconnectGraceStartedAt = null;
      player.connected = false;
      player.leftRoom = true;
      player.ws = null;
      addLog(room, `${player.name} 主动退出了房间，可稍后用房间号重新加入。`);
      send(ws, { type: 'leftRoom', roomId: room.id, message: '已退出房间，可重新输入房间号加入。' });
      ws.roomId = null;
      ws.playerIndex = null;
      refreshRoomEmptySince(room);
      broadcast(room);
    }
    return;
  }

  if (msg.type === 'takeoverOffline') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以设置 AI 接管');
    const converted = convertDisconnectedHumansToBots(room, ws.clientId);
    if (!converted) return sendError(ws, '当前没有可接管的离线真人玩家');
    touchRoom(room);
    addLog(room, `房主已设置 AI 接管 ${converted} 名离线玩家。`);
    normalizeHost(room);
    broadcast(room);
    maybeCompletePass(room);
    scheduleBot(room);
    return;
  }

  if (msg.type === 'approveTakeover') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以批准接管');
    if (!room.pendingTakeover) return sendError(ws, '当前没有待处理的接管请求');
    const pt = room.pendingTakeover;
    const targetWs = findSocketByClientId(room, pt.clientId);
    if (!targetWs) return sendError(ws, '请求者已离线');
    replaceTakeoverBotWithHuman(targetWs, room, pt.botIndex, pt.clientId, pt.nickname);
    addLog(room, `房主批准了 ${pt.nickname} 接管 AI「${pt.botName}」的牌局。`);
    room.pendingTakeover = null;
    broadcast(room);
    return;
  }

  if (msg.type === 'rejectTakeover') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以拒绝接管');
    if (!room.pendingTakeover) return sendError(ws, '当前没有待处理的接管请求');
    const pt = room.pendingTakeover;
    const targetWs = findSocketByClientId(room, pt.clientId);
    if (targetWs) send(targetWs, { type: 'takeoverRejected', roomId: room.id, message: '房主拒绝了你的接管请求' });
    addLog(room, `房主拒绝了 ${pt.nickname} 接管 AI「${pt.botName}」的请求。`);
    room.pendingTakeover = null;
    broadcast(room);
    return;
  }

  if (msg.type === 'requestTakeover') {
    const player = room.players[ws.playerIndex];
    if (!player || player.isBot) return sendError(ws, '只有真人玩家可以请求接管');
    if (room.pendingTakeover) return sendError(ws, '当前已有待处理的接管请求，请等待处理');
    const botIndex = Number(msg.botIndex);
    if (isNaN(botIndex) || botIndex < 0 || botIndex >= room.players.length) return sendError(ws, '无效的座位编号');
    const target = room.players[botIndex];
    if (!target || !target.isBot) return sendError(ws, '该座位不是 AI 玩家');
    room.pendingTakeover = {
      clientId: ws.clientId,
      nickname: player.name,
      botIndex,
      botName: target.name,
      requestedAt: Date.now()
    };
    send(ws, { type: 'takeoverRequested', roomId: room.id, botName: target.name });
    const hostWs = room.players.find(p => p.id === room.hostId)?.ws;
    if (hostWs) {
      send(hostWs, { type: 'takeoverApprovalNeeded', roomId: room.id, nickname: player.name, botName: target.name, botIndex });
    }
    addLog(room, `${player.name} 请求接管 AI「${target.name}」的牌局，等待房主批准。`);
    broadcast(room);
    return;
  }

  if (msg.type === 'disbandRoom') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以解散房间');
    closeRoom(room, '房主已解散房间');
    return;
  }

  if (msg.type === 'fillBotsAndStart') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以设置 AI 补位');

    if (room.phase === 'lobby') {
      const converted = convertLeftHumansToBots(room, ws.clientId);
      fillBots(room);
      addLog(room, converted
        ? `房主使用 AI 补位 ${converted} 名主动退出玩家，并补齐座位，牌局开始。`
        : '房主使用 AI 补齐座位，牌局开始。');
      startRound(room, { resetScores: true });
      return;
    }

    const converted = convertLeftHumansToBots(room, ws.clientId);
    if (!converted) return sendError(ws, '当前没有主动退出的真人玩家可由 AI 补位');
    touchRoom(room);
    addLog(room, `房主已设置 AI 补位 ${converted} 名主动退出玩家。`);
    normalizeHost(room);
    broadcast(room);
    maybeCompletePass(room);
    scheduleBot(room);
    return;
  }

  if (msg.type === 'startGame') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以开始游戏');
    if (room.phase !== 'lobby') return sendError(ws, '当前牌局已经开始');
    if (room.players.length !== 4) return sendError(ws, '需要 4 名玩家，或使用 AI 补位');
    startRound(room, { resetScores: true });
    return;
  }

  if (msg.type === 'passCards') {
    const error = submitPass(room, ws.playerIndex, msg.cards);
    if (error) sendError(ws, error);
    return;
  }

  if (msg.type === 'playCard') {
    const error = playCard(room, ws.playerIndex, String(msg.cardId || ''));
    if (error) sendError(ws, error);
    return;
  }


  if (msg.type === 'interaction') {
    addInteraction(room, ws.playerIndex, msg.interaction || msg);
    touchRoom(room);
    broadcast(room);
    return;
  }

  if (msg.type === 'startNextRound') {
    if (!['roundEnd'].includes(room.phase)) return sendError(ws, '当前不能开始下一局');
    room.roundNo++;
    startRound(room);
    return;
  }

  if (msg.type === 'restartGame') {
    if (!canHost(ws, room)) return sendError(ws, '只有房主可以再来一局');
    if (room.phase !== 'gameEnd') return sendError(ws, '游戏结束后才能再来一局');
    clearRoomTimers(room);
    room.roundNo = 1;
    room.gameOver = false;
    fillBots(room);
    addLog(room, '房主发起再来一局，分数已重置。');
    startRound(room, { resetScores: true });
    return;
  }

}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (error) {
      return sendError(ws, '消息格式错误');
    }

    try {
      handleMessage(ws, msg);
    } catch (error) {
      console.error(error);
      sendError(ws, '服务端处理失败：' + error.message);
    }
  });

  ws.on('close', () => {
    const room = getRoomForSocket(ws);
    if (!room) return;
    const player = room.players[ws.playerIndex];
    if (player && player.ws === ws) {
      const closedAt = Date.now();
      player.ws = null;
      player.disconnectGraceStartedAt = closedAt;
      if (player.disconnectGraceTimer) clearTimeout(player.disconnectGraceTimer);
      player.disconnectGraceTimer = setTimeout(() => {
        if (!rooms.has(room.id)) return;
        if (!player || player.isBot || player.leftRoom || player.ws) return;
        player.connected = false;
        player.disconnectedAt = closedAt;
        player.disconnectGraceTimer = null;
        player.disconnectGraceStartedAt = null;
        refreshRoomEmptySince(room);
        const expireText = connectedHumanCount(room) === 0 ? `如果 ${Math.ceil(ROOM_EMPTY_TTL_MS / 60000)} 分钟内无人重连，房间将自动解散。` : '';
        addLog(room, `${player.name} 与服务器断开超过 ${Math.ceil(DISCONNECT_GRACE_MS / 1000)} 秒，已标记离线。${expireText}`);
        broadcast(room);
      }, DISCONNECT_GRACE_MS);
    }
  });
});

setInterval(sweepAutoTakeovers, OFFLINE_TAKEOVER_SWEEP_MS).unref();
setInterval(sweepExpiredRooms, ROOM_SWEEP_INTERVAL_MS).unref();

process.on('exit', () => aiLearning.shutdown());
process.on('SIGINT', () => { aiLearning.shutdown(); process.exit(0); });
process.on('SIGTERM', () => { aiLearning.shutdown(); process.exit(0); });

  const timing = { ROOM_EMPTY_TTL_MS, ROOM_IDLE_TTL_MS, ROOM_SWEEP_INTERVAL_MS, OFFLINE_TAKEOVER_MS, OFFLINE_TAKEOVER_SWEEP_MS, DISCONNECT_GRACE_MS };
  return { wss, rooms, timing, aiLearning, stop() { aiLearning.shutdown(); wss.close(); } };
}

module.exports = { attachRealtimeGame };