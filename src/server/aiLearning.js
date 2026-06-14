const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'ai_learning.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archives');
const SAVE_INTERVAL_MS = 5 * 60 * 1000;
const MAX_GAMES_IN_MEMORY = 200;
const ARCHIVE_AFTER_GAMES = 500;

let data = null;
let dirty = false;
let saveTimer = null;

function ensureData() {
  if (!data) {
    data = createEmptyData();
    load();
  }
}

function createEmptyData() {
  return {
    version: 2,
    strategies: {},
    opponents: {},
    games: [],
    trained: {
      moonThreshold: 0.3,
      blockPriority: 1.0,
      leadSafety: 1.0,
      dumpAggression: 1.0,
      passRiskBonus: 1.0,
      passVoidBonus: 1.0,
      passMoonPreserve: 1.0,
    },
    lifecycle: {
      createdAt: Date.now(),
      lastArchived: null,
      lastTrained: null,
      totalGames: 0,
      totalRounds: 0,
      trainingRounds: 0,
    },
  };
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) {
        data = parsed;
        return;
      }
      if (parsed && parsed.version === 1) {
        data = migrateV1(parsed);
        dirty = true;
        return;
      }
    }
  } catch (_) {}
  data = createEmptyData();
}

function migrateV1(old) {
  const d = createEmptyData();
  d.strategies = old.strategies || {};
  d.opponents = old.opponents || {};
  d.lifecycle.createdAt = Date.now();
  return d;
}

function scheduleSave() {
  if (saveTimer) return;
  dirty = true;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush();
  }, SAVE_INTERVAL_MS);
}

function flush() {
  if (!dirty || !data) return;
  dirty = false;
  try {
    rotateIfNeeded();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

function shutdown() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  flush();
}

// ── 数据生命周期 ──

function rotateIfNeeded() {
  if (!data || !data.games) return;
  if (data.games.length <= MAX_GAMES_IN_MEMORY) return;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = data.games.filter(g => g.timestamp > cutoff);
  const old = data.games.filter(g => g.timestamp <= cutoff);
  if (old.length > 0) archiveGames(old);
  data.games = recent.slice(-MAX_GAMES_IN_MEMORY);
  dirty = true;
  scheduleSave();
}

function archiveGames(games) {
  try {
    if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    const month = new Date().toISOString().slice(0, 7);
    const file = path.join(ARCHIVE_DIR, `games_${month}.json`);
    let existing = [];
    if (fs.existsSync(file)) {
      existing = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    existing.push(...games);
    fs.writeFileSync(file, JSON.stringify(existing), 'utf8');
    data.lifecycle.lastArchived = Date.now();
  } catch (_) {}
}

function exportTrainingData() {
  ensureData();
  const archiveFiles = [];
  try {
    if (fs.existsSync(ARCHIVE_DIR)) {
      const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.json'));
      for (const f of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, f), 'utf8'));
          archiveFiles.push(...content);
        } catch (_) {}
      }
    }
  } catch (_) {}
  return {
    current: data.games || [],
    archived: archiveFiles,
    strategies: data.strategies,
    opponents: data.opponents,
    totalGames: data.lifecycle.totalGames,
    totalRounds: data.lifecycle.totalRounds,
  };
}

function getDataSize() {
  ensureData();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stat = fs.statSync(DATA_FILE);
      return { bytes: stat.size, games: data.games?.length || 0 };
    }
  } catch (_) {}
  return { bytes: 0, games: 0 };
}

// ── 策略统计 ──

function recordStrategyOutcome(strategy, success, pointsGained) {
  ensureData();
  if (!data.strategies[strategy]) data.strategies[strategy] = { attempts: 0, successes: 0, totalPoints: 0 };
  const s = data.strategies[strategy];
  s.attempts += 1;
  if (success) s.successes += 1;
  s.totalPoints += pointsGained || 0;
  scheduleSave();
}

function getStrategySuccessRate(strategy) {
  ensureData();
  const s = data.strategies[strategy];
  if (!s || s.attempts === 0) return null;
  return s.successes / s.attempts;
}

function getStrategySampleSize(strategy) {
  ensureData();
  const s = data.strategies[strategy];
  return s ? s.attempts : 0;
}

// ── 对手建模 ──

function recordOpponentRound(clientId, profile) {
  ensureData();
  if (!data.opponents[clientId]) {
    data.opponents[clientId] = {
      rounds: 0, moonAttempts: 0, moonSuccesses: 0,
      aggressivePlays: 0, defensivePlays: 0,
      pointsCollected: 0, gamesPlayed: 0, lastSeen: 0,
    };
  }
  const o = data.opponents[clientId];
  o.rounds += 1;
  o.lastSeen = Date.now();
  if (profile.moonAttempt) o.moonAttempts += 1;
  if (profile.moonSuccess) o.moonSuccesses += 1;
  if (profile.aggressive) o.aggressivePlays += 1;
  if (profile.defensive) o.defensivePlays += 1;
  o.pointsCollected += profile.points || 0;
  scheduleSave();
}

function recordOpponentGame(clientId) {
  ensureData();
  if (!data.opponents[clientId]) {
    data.opponents[clientId] = {
      rounds: 0, moonAttempts: 0, moonSuccesses: 0,
      aggressivePlays: 0, defensivePlays: 0,
      pointsCollected: 0, gamesPlayed: 0, lastSeen: 0,
    };
  }
  data.opponents[clientId].gamesPlayed += 1;
  data.opponents[clientId].lastSeen = Date.now();
  scheduleSave();
}

function getOpponentProfile(clientId) {
  ensureData();
  return data.opponents[clientId] || null;
}

function getOpponentMoonRate(clientId) {
  const o = getOpponentProfile(clientId);
  if (!o || o.rounds < 3) return null;
  return o.moonAttempts / o.rounds;
}

function getOpponentAggression(clientId) {
  const o = getOpponentProfile(clientId);
  if (!o || o.rounds < 3) return null;
  const total = o.aggressivePlays + o.defensivePlays;
  if (total === 0) return 0.5;
  return o.aggressivePlays / total;
}

// ── 对局记录 ──

function recordPassDecision(room, playerIndex, cards) {
  ensureData();
  if (!room._passData) room._passData = {};
  const hasS12 = cards.some(c => c.id === 'S12');
  const hasHighHeart = cards.some(c => c.suit === 'H' && c.rank >= 11);
  const hasHighSpade = cards.some(c => c.suit === 'S' && c.rank >= 13);
  const suitsPassed = new Set(cards.map(c => c.suit));
  const hand = room.players[playerIndex]?.hand || [];
  const handSuits = new Set(hand.map(c => c.suit));
  const voidCreated = [...handSuits].some(s => !suitsPassed.has(s) && hand.filter(c => c.suit === s).length <= 3);

  room._passData[playerIndex] = {
    riskCards: (hasS12 ? 1 : 0) + (hasHighHeart ? 1 : 0) + (hasHighSpade ? 1 : 0),
    voidCreated,
    totalDanger: cards.reduce((sum, c) => sum + (c.rank || 0) + (c.suit === 'S' && c.rank === 12 ? 120 : 0), 0),
  };
}

function recordPassOutcome(room) {
  ensureData();
  if (!room._passData) return;
  for (let i = 0; i < room.players.length; i += 1) {
    const p = room.players[i];
    if (!p.isBot) continue;
    const pd = room._passData[i];
    if (!pd) continue;
    if (pd.riskCards >= 2) recordStrategyOutcome('pass_risk_high', true, -p.round);
    if (pd.voidCreated) recordStrategyOutcome('pass_void', true, -p.round);
  }
  delete room._passData;
}

function recordGame(room) {
  ensureData();
  const game = {
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    players: room.players.map(p => ({
      clientId: p.id,
      name: p.name,
      isBot: p.isBot,
      finalScore: p.total,
      roundScores: [],
    })),
    aiDecisions: [],
    passData: [],
    winner: null,
    totalTricks: room.trickNo || 13,
  };

  for (let i = 0; i < room.players.length; i += 1) {
    const p = room.players[i];
    game.players[i].roundScores.push(p.round);
    if (p.isBot && room._aiStrategies?.[i]) {
      const st = room._aiStrategies[i];
      game.aiDecisions.push({
        trickNo: room.trickNo,
        playerIndex: i,
        strategy: st.moonAttempt ? 'moon_attempt' : st.moonBlocked ? 'block_moon' : 'normal',
        phase: st.phase,
      });
    }
    if (p.isBot && room.lastPassCards?.[i]) {
      const passCards = room.lastPassCards[i];
      const hasS12 = passCards.some(c => c.id === 'S12');
      const hasHighHeart = passCards.some(c => c.suit === 'H' && c.rank >= 11);
      const hasHighSpade = passCards.some(c => c.suit === 'S' && c.rank >= 13);
      game.passData.push({
        playerIndex: i,
        riskCards: (hasS12 ? 1 : 0) + (hasHighHeart ? 1 : 0) + (hasHighSpade ? 1 : 0),
        totalDanger: passCards.reduce((sum, c) => sum + cardDangerValue(c), 0),
      });
    }
  }

  const minScore = Math.min(...room.players.map(p => p.total));
  const winnerIdx = room.players.findIndex(p => p.total === minScore);
  game.winner = room.players[winnerIdx]?.name || null;

  data.games.push(game);
  data.lifecycle.totalGames += 1;
  data.lifecycle.totalRounds += room.roundNo || 1;

  rotateIfNeeded();
  scheduleSave();
  maybeTrain();
}

// ── 自动训练 ──

const TRAIN_INTERVAL = 10;

function maybeTrain() {
  ensureData();
  if (data.lifecycle.totalGames % TRAIN_INTERVAL !== 0) return;
  if (data.games.length < TRAIN_INTERVAL) return;
  train();
}

function train() {
  ensureData();
  const recent = data.games.slice(-TRAIN_INTERVAL);
  const moonGames = recent.filter(g => {
    const ai = g.players.find(p => p.isBot);
    return ai && ai.roundScores?.[0] === 26;
  });
  const zeroGames = recent.filter(g => {
    const ai = g.players.find(p => p.isBot);
    return ai && ai.roundScores?.[0] === 0;
  });
  const loseGames = recent.filter(g => {
    const ai = g.players.find(p => p.isBot);
    return ai && ai.finalScore >= 50;
  });
  const lowScoreGames = recent.filter(g => {
    const ai = g.players.find(p => p.isBot);
    return ai && ai.finalScore <= 10 && ai.roundScores?.[0] !== 0;
  });

  const t = data.trained;
  const lr = 0.1;

  for (const g of moonGames) {
    const decisions = g.aiDecisions.filter(d => d.strategy === 'moon_attempt');
    if (decisions.length > 0) {
      t.moonThreshold = Math.max(0.1, t.moonThreshold - lr * 0.5);
    }
    const passDecisions = g.aiDecisions.filter(d => d.phase === 'pass_moon');
    if (passDecisions.length > 0) {
      t.passMoonPreserve = Math.min(2.0, t.passMoonPreserve + lr * 0.3);
    }
  }

  for (const g of zeroGames) {
    const decisions = g.aiDecisions.filter(d => d.strategy === 'normal');
    if (decisions.length > 0) {
      t.leadSafety = Math.min(2.0, t.leadSafety + lr * 0.3);
      t.dumpAggression = Math.max(0.5, t.dumpAggression - lr * 0.2);
    }
  }

  for (const g of loseGames) {
    const moonDecisions = g.aiDecisions.filter(d => d.strategy === 'moon_attempt');
    const ai = g.players.find(p => p.isBot);
    if (moonDecisions.length > 0 && ai && ai.finalScore > 60) {
      t.moonThreshold = Math.min(0.5, t.moonThreshold + lr * 0.3);
    }
  }

  for (const g of lowScoreGames) {
    const passDecisions = g.aiDecisions.filter(d => d.phase === 'pass_risk');
    if (passDecisions.length > 0) {
      t.passRiskBonus = Math.min(2.0, t.passRiskBonus + lr * 0.2);
    }
    const voidDecisions = g.aiDecisions.filter(d => d.phase === 'pass_void');
    if (voidDecisions.length > 0) {
      t.passVoidBonus = Math.min(2.0, t.passVoidBonus + lr * 0.2);
    }
  }

  const blockGames = recent.filter(g => {
    return g.aiDecisions.some(d => d.strategy === 'block_moon');
  });
  if (blockGames.length >= 3) {
    const blockSuccess = blockGames.filter(g => {
      const human = g.players.find(p => !p.isBot);
      return human && human.finalScore < 40;
    });
    if (blockSuccess.length >= 2) {
      t.blockPriority = Math.min(2.0, t.blockPriority + lr * 0.2);
    }
  }

  t.moonThreshold = clamp(t.moonThreshold, 0.1, 0.5);
  t.blockPriority = clamp(t.blockPriority, 0.5, 2.0);
  t.leadSafety = clamp(t.leadSafety, 0.5, 2.0);
  t.dumpAggression = clamp(t.dumpAggression, 0.5, 2.0);
  t.passRiskBonus = clamp(t.passRiskBonus, 0.5, 2.0);
  t.passVoidBonus = clamp(t.passVoidBonus, 0.5, 2.0);
  t.passMoonPreserve = clamp(t.passMoonPreserve, 0.5, 2.0);

  data.lifecycle.lastTrained = Date.now();
  data.lifecycle.trainingRounds += 1;
  dirty = true;
  scheduleSave();
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function getTrainedWeight(key) {
  ensureData();
  return data.trained?.[key] ?? 1.0;
}

// ── AI 决策辅助 ──

function shouldPreferMoon(baseDecision, handControlScore) {
  ensureData();
  const rate = getStrategySuccessRate('moon_attempt');
  const samples = getStrategySampleSize('moon_attempt');
  const threshold = data.trained?.moonThreshold || 0.3;
  if (samples < 10) return baseDecision;
  if (rate >= threshold && handControlScore >= 6) return true;
  if (rate < threshold * 0.5) return false;
  return baseDecision;
}

function adjustMoonThreatForOpponent(clientId, baseThreat) {
  if (!clientId || !baseThreat) return baseThreat;
  const moonRate = getOpponentMoonRate(clientId);
  if (moonRate === null) return baseThreat;
  if (moonRate >= 0.3) return { ...baseThreat, confidence: 'high' };
  if (moonRate < 0.1) return null;
  return baseThreat;
}

function suggestDefensivePlay(opponentClientId) {
  if (!opponentClientId) return false;
  const aggression = getOpponentAggression(opponentClientId);
  if (aggression === null) return false;
  return aggression >= 0.6;
}

function getData() {
  ensureData();
  return data;
}

module.exports = {
  load, flush, shutdown,
  recordStrategyOutcome, getStrategySuccessRate, getStrategySampleSize,
  recordOpponentRound, recordOpponentGame, getOpponentProfile,
  getOpponentMoonRate, getOpponentAggression,
  shouldPreferMoon, adjustMoonThreatForOpponent, suggestDefensivePlay,
  recordGame, recordPassDecision, recordPassOutcome, exportTrainingData, getDataSize, getData,
  train, getTrainedWeight,
};
