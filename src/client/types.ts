// ── 核心牌型 ──
export interface Card {
  suit: 'C' | 'D' | 'S' | 'H'
  rank: number
  id: string
}

export interface SuitInfo {
  symbol: string
  name: string
  color: 'black' | 'red'
  order: number
}

export type SuitKey = 'C' | 'D' | 'S' | 'H'

// ── 玩家 ──
export interface Player {
  id: string
  name: string
  avatar: string
  avatarClass: string
  hand: Card[]
  handCount: number
  taken: Card[]
  round: number
  total: number
  isBot: boolean
  aiControlled: boolean
  connected: boolean
  leftRoom: boolean
  passed: boolean
  receivedCards: Card[]
  receivedFrom: string
}

// ── 游戏阶段 ──
export type GamePhase = 'offline' | 'lobby' | 'deal' | 'pass' | 'play' | 'roundEnd' | 'gameEnd'

// ── 出牌记录 ──
export interface TrickPlay {
  player: number
  card: Card
}

// ── 上一轮 ──
export interface LastTrick {
  leadSuit: string
  leaderPlayer: number | null
  winnerPlayer: number | null
  winningRank: number
  points: number
  cards: TrickPlay[]
}

// ── 互动 ──
export interface Interaction {
  seq: number
  round: number
  kind: string
  icon: string
  label: string
  fromIndex: number
  toIndex: number
  from: string
  to: string
  at: number
}

export interface InteractionItem {
  kind: string
  icon: string
  label: string
  cooldown: number
  className?: string
}

// ── 特效事件 ──
export type EventLevel = 'minor' | 'highlight' | 'epic' | 'legendary'

export interface SpecialEvent {
  seq: number
  round: number
  type: string
  level: EventLevel
  title: string
  subtitle: string
  player: string
  playerIndex: number | null
  points: number
  at: number
}

// ── 传牌 ──
export interface PassFlow {
  seq: number
  roundNo: number
  passMode: number
  flows: { from: number; to: number; count: number }[]
}

// ── 牌桌全览 ──
export interface RoundTablePlayer {
  index: number
  name: string
  avatar: string
  round: number
  total: number
  cards: Card[]
  receivedCards: Card[]
  passedCards: Card[]
  passedTo: string
}

export interface RoundTable {
  roundNo: number
  passMode: number
  passName: string
  players: RoundTablePlayer[]
}

// ── 日志 ──
export interface LogEntry {
  round: number
  text: string
}

// ── 服务器状态消息 ──
export interface ServerState {
  type: 'state'
  roomId: string
  yourIndex: number
  hostId: string
  isHost: boolean
  phase: string
  roundNo: number
  passMode: number
  passName: string
  players: {
    id: string
    name: string
    avatar: string
    isBot: boolean
    aiControlled: boolean
    connected: boolean
    leftRoom: boolean
    hand: Card[]
    handCount: number
    round: number
    total: number
    passed: boolean
  }[]
  trick: TrickPlay[]
  trickNo: number
  currentPlayer: number
  heartsBroken: boolean
  busy: boolean
  comparingTrick: boolean
  collectingTrick: boolean
  trickWinnerPlayer: number | null
  judgeText: string
  gameOver: boolean
  moonShooter: number | null
  legalCardIds: string[]
  receivedCards: Card[]
  receivedFrom: string
  specialEvents: SpecialEvent[]
  interactions: Interaction[]
  passFlow: PassFlow | null
  lastTrick: LastTrick | null
  roundTable: RoundTable | null
  log: LogEntry[]
}

// ── WS 消息类型 ──
export type ClientMessage =
  | { type: 'hello'; roomId: string }
  | { type: 'createRoom'; nickname: string }
  | { type: 'joinRoom'; roomId: string; nickname: string }
  | { type: 'leaveRoom' }
  | { type: 'startGame' }
  | { type: 'fillBotsAndStart' }
  | { type: 'passCards'; cards: string[] }
  | { type: 'playCard'; cardId: string }
  | { type: 'interaction'; interaction: { kind: string; icon: string; label: string; toIndex: number } }
  | { type: 'startNextRound' }
  | { type: 'restartGame' }
  | { type: 'disbandRoom' }
  | { type: 'takeoverOffline' }
  | { type: 'requestTakeover'; botIndex: number }
  | { type: 'approveTakeover' }
  | { type: 'rejectTakeover' }

export type ServerMessage =
  | ServerState
  | { type: 'roomCreated'; roomId: string }
  | { type: 'roomClosed'; roomId: string; message: string }
  | { type: 'leftRoom'; roomId: string; message: string }
  | { type: 'error'; message: string }
  | { type: 'takeoverRequested'; roomId: string; botName: string }
  | { type: 'takeoverRejected'; message: string }
  | { type: 'takeoverApprovalNeeded'; roomId: string; nickname: string; botName: string; botIndex: number }

// ── 设置 ──
export interface Settings {
  soundEnabled: boolean
  soundVolume: number
  effectsEnabled: boolean
  effectSpeed: number
  bgmEnabled: boolean
  bgmVolume: number
  interactionEffectsEnabled: boolean
  interactionSoundEnabled: boolean
  allowTomato: boolean
  forceLandscape: boolean
}

// ── 常量 ──
export const PASS_NAMES = ['向左传牌', '向右传牌', '对家传牌', '不传牌'] as const
export const PASS_HINTS = ['选择 3 张牌传给左边。', '选择 3 张牌传给右边。', '选择 3 张牌传给对家。', '本局不传牌。'] as const
export const PASS_DIRS = [1, 3, 2, 0] as const

export const SUITS: Record<SuitKey, SuitInfo> = {
  C: { symbol: '♣', name: '梅花', color: 'black', order: 0 },
  D: { symbol: '♦', name: '方块', color: 'red', order: 1 },
  S: { symbol: '♠', name: '黑桃', color: 'black', order: 2 },
  H: { symbol: '♥', name: '红桃', color: 'red', order: 3 }
}

export const VIEW_AVATAR_CLASSES = ['you', 'west', 'north', 'east'] as const
export const VIEW_AVATARS = ['🐾', '魏', '蜀', '吴'] as const

export function rankText(rank: number): string {
  if (rank <= 10) return String(rank)
  return ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[rank] || String(rank)
}

export function cardName(card: Card): string {
  return SUITS[card.suit].name + rankText(card.rank)
}

export function isPoint(card: Card): boolean {
  return card.suit === 'H' || (card.suit === 'S' && card.rank === 12)
}

export function cardPoints(card: Card): number {
  if (card.suit === 'H') return 1
  if (card.suit === 'S' && card.rank === 12) return 13
  return 0
}
