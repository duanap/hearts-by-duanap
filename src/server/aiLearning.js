const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'ai_learning.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archives');
const SAVE_INTERVAL_MS = 5 * 60 * 1000;
const MAX_GAMES_IN_MEMORY = 200;

let data = null;
let dirty = false;
let saveTimer = null;

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

function migrateV1(old) {
  const next = createEmptyData();
  next.strategies = old.strategies || {};
  next.opponents = old.opponents || {};
  return next;
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
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
  } catch (error) {
    // Bad local learning data should not break live games.
  }
  data = createEmptyData();
}

function ensureData() {
  if (!data) {
    data = createEmptyData();
    load();
  }
}

function scheduleSave() {
  dirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush();
  }, SAVE_INTERVAL_MS);
  saveTimer.unref?.();
}

function archiveGames(games) {
  try {
    if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    const month = new Date().toISOString().slice(0, 7);
    const file = path.join(ARCHIVE_DIR, `games_${month}.json`);
    let existing = [];
    if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, 'utf8'));
    existing.push(...games);
    fs.writeFileSync(file, JSON.stringify(existing), 'utf8');
    data.lifecycle.lastArchived = Date.now();
  } catch (error) {
    // Archiving is best-effort; keep gameplay independent from disk state.
  }
}

function rotateIfNeeded() {
  if (!data?.games || data.games.length <= MAX_GAMES_IN_MEMORY) return;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = data.games.filter(game => game.timestamp > cutoff);
  const old = data.games.filter(game => game.timestamp <= cutoff);
  if (old.length) archiveGames(old);
  data.games = recent.slice(-MAX_GAMES_IN_MEMORY);
  dirty = true;
}

function flush() {
  if (!dirty || !data) return;
  dirty = false;
  try {
    rotateIfNeeded();
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    dirty = true;
  }
}

function shutdown() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flush();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cardDangerValue(card) {
  let score = Number(card?.rank || 0);
  if (card?.suit === 'S' && card.rank === 12) score += 120;
  if (card?.suit === 'S' && card.rank >= 13) score += 46;
  if (card?.suit === 'H') score += 22 + card.rank;
  if (card?.rank >= 12) score += 10;
  return score;
}

function recordStrategyOutcome(strategy, success, pointsGained = 0) {
  ensureData();
  if (!data.strategies[strategy]) data.strategies[strategy] = { attempts: 0, successes: 0, totalPoints: 0 };
  const item = data.strategies[strategy];
  item.attempts += 1;
  if (success) item.successes += 1;
  item.totalPoints += pointsGained || 0;
  scheduleSave();
}

function getStrategySuccessRate(strategy) {
  ensureData();
  const item = data.strategies[strategy];
  if (!item?.attempts) return null;
  return item.successes / item.attempts;
}

function getStrategySampleSize(strategy) {
  ensureData();
  return data.strategies[strategy]?.attempts || 0;
}

function ensureOpponent(clientId) {
  ensureData();
  if (!data.opponents[clientId]) {
    data.opponents[clientId] = {
      rounds: 0,
      moonAttempts: 0,
      moonSuccesses: 0,
      aggressivePlays: 0,
      defensivePlays: 0,
      pointsCollected: 0,
      gamesPlayed: 0,
      lastSeen: 0,
    };
  }
  return data.opponents[clientId];
}

function recordOpponentRound(clientId, profile) {
  if (!clientId) return;
  const item = ensureOpponent(clientId);
  item.rounds += 1;
  item.lastSeen = Date.now();
  if (profile.moonAttempt) item.moonAttempts += 1;
  if (profile.moonSuccess) item.moonSuccesses += 1;
  if (profile.aggressive) item.aggressivePlays += 1;
  if (profile.defensive) item.defensivePlays += 1;
  item.pointsCollected += profile.points || 0;
  scheduleSave();
}

function recordOpponentGame(clientId) {
  if (!clientId) return;
  const item = ensureOpponent(clientId);
  item.gamesPlayed += 1;
  item.lastSeen = Date.now();
  scheduleSave();
}

function getOpponentProfile(clientId) {
  ensureData();
  return data.opponents[clientId] || null;
}

function getOpponentMoonRate(clientId) {
  const item = getOpponentProfile(clientId);
  if (!item || item.rounds < 3) return null;
  return item.moonAttempts / item.rounds;
}

function getOpponentAggression(clientId) {
  const item = getOpponentProfile(clientId);
  if (!item || item.rounds < 3) return null;
  const total = item.aggressivePlays + item.defensivePlays;
  return total ? item.aggressivePlays / total : 0.5;
}

function recordPassDecision(room, playerIndex, cards) {
  ensureData();
  if (!room._passData) room._passData = {};
  const passed = Array.isArray(cards) ? cards : [];
  const hand = room.players[playerIndex]?.hand || [];
  const suitsPassed = new Set(passed.map(card => card.suit));
  const handSuits = new Set(hand.map(card => card.suit));
  const voidCreated = [...handSuits].some(suit => (
    !suitsPassed.has(suit) && hand.filter(card => card.suit === suit).length <= 3
  ));

  room._passData[playerIndex] = {
    riskCards:
      (passed.some(card => card.id === 'S12') ? 1 : 0) +
      (passed.some(card => card.suit === 'H' && card.rank >= 11) ? 1 : 0) +
      (passed.some(card => card.suit === 'S' && card.rank >= 13) ? 1 : 0),
    voidCreated,
    totalDanger: passed.reduce((sum, card) => sum + cardDangerValue(card), 0),
  };
}

function recordPassOutcome(room) {
  ensureData();
  if (!room._passData) return;
  for (let index = 0; index < room.players.length; index += 1) {
    const player = room.players[index];
    if (!player?.isBot) continue;
    const pass = room._passData[index];
    if (!pass) continue;
    if (pass.riskCards >= 2) recordStrategyOutcome('pass_risk_high', true, -player.round);
    if (pass.voidCreated) recordStrategyOutcome('pass_void', true, -player.round);
  }
  delete room._passData;
}

function recordGame(room) {
  ensureData();
  const game = {
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    players: room.players.map(player => ({
      clientId: player.id,
      name: player.name,
      isBot: player.isBot,
      finalScore: player.total,
      roundScores: [player.round],
    })),
    aiDecisions: [],
    passData: [],
    winner: null,
    totalTricks: room.trickNo || 13,
  };

  for (let index = 0; index < room.players.length; index += 1) {
    const player = room.players[index];
    if (player.isBot && room._aiStrategies?.[index]) {
      const strategy = room._aiStrategies[index];
      game.aiDecisions.push({
        trickNo: room.trickNo,
        playerIndex: index,
        strategy: strategy.moonAttempt ? 'moon_attempt' : strategy.moonBlocked ? 'block_moon' : 'normal',
        phase: strategy.phase || 'mid',
      });
    }
    if (player.isBot && room.lastPassCards?.[index]) {
      const cards = room.lastPassCards[index];
      game.passData.push({
        playerIndex: index,
        riskCards:
          (cards.some(card => card.id === 'S12') ? 1 : 0) +
          (cards.some(card => card.suit === 'H' && card.rank >= 11) ? 1 : 0) +
          (cards.some(card => card.suit === 'S' && card.rank >= 13) ? 1 : 0),
        totalDanger: cards.reduce((sum, card) => sum + cardDangerValue(card), 0),
      });
    }
  }

  const minScore = Math.min(...room.players.map(player => player.total));
  const winnerIndex = room.players.findIndex(player => player.total === minScore);
  game.winner = room.players[winnerIndex]?.name || null;

  data.games.push(game);
  data.lifecycle.totalGames += 1;
  data.lifecycle.totalRounds += 1;
  rotateIfNeeded();
  maybeTrain();
  scheduleSave();
}

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
  const trained = data.trained;
  const lr = 0.1;

  for (const game of recent) {
    const ai = game.players.find(player => player.isBot);
    if (!ai) continue;

    if (ai.roundScores?.[0] === 26 && game.aiDecisions.some(item => item.strategy === 'moon_attempt')) {
      trained.moonThreshold = Math.max(0.1, trained.moonThreshold - lr * 0.5);
      if (game.aiDecisions.some(item => item.phase === 'pass_moon')) {
        trained.passMoonPreserve = Math.min(2.0, trained.passMoonPreserve + lr * 0.3);
      }
    }

    if (ai.roundScores?.[0] === 0 && game.aiDecisions.some(item => item.strategy === 'normal')) {
      trained.leadSafety = Math.min(2.0, trained.leadSafety + lr * 0.3);
      trained.dumpAggression = Math.max(0.5, trained.dumpAggression - lr * 0.2);
    }

    if (ai.finalScore >= 50 && game.aiDecisions.some(item => item.strategy === 'moon_attempt')) {
      trained.moonThreshold = Math.min(0.5, trained.moonThreshold + lr * 0.3);
    }

    if (ai.finalScore <= 10 && ai.roundScores?.[0] !== 0) {
      if (game.aiDecisions.some(item => item.phase === 'pass_risk')) {
        trained.passRiskBonus = Math.min(2.0, trained.passRiskBonus + lr * 0.2);
      }
      if (game.aiDecisions.some(item => item.phase === 'pass_void')) {
        trained.passVoidBonus = Math.min(2.0, trained.passVoidBonus + lr * 0.2);
      }
    }
  }

  const blockGames = recent.filter(game => game.aiDecisions.some(item => item.strategy === 'block_moon'));
  if (blockGames.length >= 3) {
    const blockSuccess = blockGames.filter(game => {
      const human = game.players.find(player => !player.isBot);
      return human && human.finalScore < 40;
    });
    if (blockSuccess.length >= 2) trained.blockPriority = Math.min(2.0, trained.blockPriority + lr * 0.2);
  }

  trained.moonThreshold = clamp(trained.moonThreshold, 0.1, 0.5);
  trained.blockPriority = clamp(trained.blockPriority, 0.5, 2.0);
  trained.leadSafety = clamp(trained.leadSafety, 0.5, 2.0);
  trained.dumpAggression = clamp(trained.dumpAggression, 0.5, 2.0);
  trained.passRiskBonus = clamp(trained.passRiskBonus, 0.5, 2.0);
  trained.passVoidBonus = clamp(trained.passVoidBonus, 0.5, 2.0);
  trained.passMoonPreserve = clamp(trained.passMoonPreserve, 0.5, 2.0);

  data.lifecycle.lastTrained = Date.now();
  data.lifecycle.trainingRounds += 1;
  dirty = true;
}

function getTrainedWeight(key) {
  ensureData();
  return data.trained?.[key] ?? 1.0;
}

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
  const rate = getOpponentMoonRate(clientId);
  if (rate === null) return baseThreat;
  if (rate >= 0.3) return { ...baseThreat, confidence: 'high' };
  if (rate < 0.1) return null;
  return baseThreat;
}

function suggestDefensivePlay(opponentClientId) {
  if (!opponentClientId) return false;
  const aggression = getOpponentAggression(opponentClientId);
  return aggression != null && aggression >= 0.6;
}

function exportTrainingData() {
  ensureData();
  const archived = [];
  try {
    if (fs.existsSync(ARCHIVE_DIR)) {
      for (const file of fs.readdirSync(ARCHIVE_DIR).filter(item => item.endsWith('.json'))) {
        try {
          archived.push(...JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf8')));
        } catch (error) {
          // Ignore bad archive chunks.
        }
      }
    }
  } catch (error) {
    // Ignore archive read failures.
  }
  return {
    current: data.games || [],
    archived,
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
  } catch (error) {
    // Ignore stat failures.
  }
  return { bytes: 0, games: data.games?.length || 0 };
}

function getData() {
  ensureData();
  return data;
}

module.exports = {
  load,
  flush,
  shutdown,
  recordStrategyOutcome,
  getStrategySuccessRate,
  getStrategySampleSize,
  recordOpponentRound,
  recordOpponentGame,
  getOpponentProfile,
  getOpponentMoonRate,
  getOpponentAggression,
  shouldPreferMoon,
  adjustMoonThreatForOpponent,
  suggestDefensivePlay,
  recordGame,
  recordPassDecision,
  recordPassOutcome,
  exportTrainingData,
  getDataSize,
  getData,
  train,
  getTrainedWeight,
};
