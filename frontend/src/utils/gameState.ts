import type { Card, GamePhase, LastTrick, PlayerState, RoundTable, RoundTablePlayer, SeatPosition, TrickPlay } from "../types/messages";
import { cardName, PASS_HINTS, SEAT_POSITIONS, sortCards, SUITS, VIEW_AVATAR_CLASSES, VIEW_AVATARS } from "./cards";
import { cleanJudgeText } from "./format";

export interface ViewPlayer extends PlayerState {
  absIndex: number;
  avatarClass: string;
  position: SeatPosition;
  viewIndex: number;
}

export interface IllegalCardContext {
  phase: GamePhase;
  currentPlayer: number;
  busy: boolean;
  comparingTrick: boolean;
  collectingTrick: boolean;
  heartsBroken: boolean;
  trickNo: number;
  trick: TrickPlay[];
  hand: Card[];
  legalCardIds: Set<string>;
  youPassed: boolean;
}

export interface GameStateView extends IllegalCardContext {
  passMode: number;
  selectedPass: Set<string>;
  passSending: boolean;
  players: ViewPlayer[];
  seats?: Array<{ viewIndex: number; player: ViewPlayer }>;
  trickWinnerPlayer?: number | null;
  lastTrick?: LastTrick | null;
  roundTable?: RoundTable | null;
  isHost?: boolean;
}

export interface RankingItem {
  player: ViewPlayer;
  index: number;
  rank: number;
  round: number;
  total: number;
  isWinner: boolean;
}

export interface RoundTablePlayerRow extends RoundTablePlayer {
  receivedIdSet: Set<string>;
}

export function absToViewIndex(absIndex: number | null | undefined, yourIndex: number): number {
  if (absIndex == null || absIndex < 0) return absIndex ?? 0;
  return (absIndex - yourIndex + 4) % 4;
}

export function viewToAbsIndex(viewIndex: number, yourIndex: number): number {
  return (yourIndex + viewIndex) % 4;
}

export function createPlaceholderPlayers(): ViewPlayer[] {
  return [0, 1, 2, 3].map(viewIndex => ({
    id: "",
    name: viewIndex === 0 ? "你" : "等待中",
    avatar: VIEW_AVATARS[viewIndex],
    avatarClass: VIEW_AVATAR_CLASSES[viewIndex],
    position: SEAT_POSITIONS[viewIndex],
    viewIndex,
    absIndex: viewIndex,
    isBot: false,
    aiControlled: false,
    connected: false,
    leftRoom: false,
    hand: [],
    handCount: 0,
    round: 0,
    total: 0,
    passed: false
  }));
}

export function buildViewPlayers(serverPlayers: readonly PlayerState[], yourIndex: number): ViewPlayer[] {
  const placeholders = createPlaceholderPlayers();
  return [0, 1, 2, 3].map(viewIndex => {
    const absIndex = viewToAbsIndex(viewIndex, yourIndex);
    const player = serverPlayers[absIndex];
    if (!player) return { ...placeholders[viewIndex], absIndex };

    return {
      id: player.id || "",
      name: player.name || (viewIndex === 0 ? "你" : "等待中"),
      avatar: player.avatar || VIEW_AVATARS[viewIndex],
      avatarClass: VIEW_AVATAR_CLASSES[viewIndex],
      position: SEAT_POSITIONS[viewIndex],
      viewIndex,
      absIndex,
      isBot: Boolean(player.isBot),
      aiControlled: Boolean(player.aiControlled),
      connected: Boolean(player.connected),
      leftRoom: Boolean(player.leftRoom),
      hand: viewIndex === 0 ? sortCards(player.hand || []) : [],
      handCount: Number.isInteger(player.handCount) ? player.handCount : (player.hand || []).length,
      round: Number(player.round || 0),
      total: Number(player.total || 0),
      passed: Boolean(player.passed)
    };
  });
}

export function mapTrickToView(trick: readonly TrickPlay[], yourIndex: number): TrickPlay[] {
  return (trick || []).map(play => ({
    player: absToViewIndex(play.player, yourIndex),
    card: play.card
  }));
}

export function normalizeLastTrick(last: LastTrick | null | undefined, yourIndex: number): LastTrick | null {
  if (!last) return null;
  return {
    ...last,
    leadSuit: last.leadSuit || "",
    leaderPlayer: last.leaderPlayer == null ? null : absToViewIndex(last.leaderPlayer, yourIndex),
    winnerPlayer: absToViewIndex(last.winnerPlayer, yourIndex),
    cards: mapTrickToView(last.cards || [], yourIndex)
  };
}

export function buildScores(players: readonly ViewPlayer[]) {
  return players.map(player => ({
    playerId: player.id,
    name: player.name,
    round: Number(player.round || 0),
    total: Number(player.total || 0)
  }));
}

export function getMyPlayer(state: Pick<GameStateView, "players">): ViewPlayer | null {
  return state.players[0] || null;
}

export function getMySeat(state: Pick<GameStateView, "seats" | "players">) {
  return state.seats?.find(seat => seat.viewIndex === 0) || null;
}

export function getVisibleSeats(state: Pick<GameStateView, "seats" | "players">) {
  return state.seats?.length ? state.seats : state.players.map((player, viewIndex) => ({ viewIndex, player }));
}

export function isMyTurn(state: Pick<GameStateView, "phase" | "currentPlayer" | "busy" | "comparingTrick" | "collectingTrick">): boolean {
  return state.phase === "play" && state.currentPlayer === 0 && !state.busy && !state.comparingTrick && !state.collectingTrick;
}

export function isPassingPhase(state: Pick<GameStateView, "phase">): boolean {
  return state.phase === "pass";
}

export function canSelectPassCard(
  state: Pick<GameStateView, "phase" | "youPassed" | "passSending" | "selectedPass">,
  cardId: string
): boolean {
  if (state.phase !== "pass" || state.youPassed || state.passSending) return false;
  return state.selectedPass.has(cardId) || state.selectedPass.size < 3;
}

export function getPassDirectionLabel(passMode: number): string {
  return PASS_HINTS[passMode] || PASS_HINTS[0];
}

export function getCurrentPlayerName(state: Pick<GameStateView, "players" | "currentPlayer">): string {
  return state.players[state.currentPlayer]?.name || "其他玩家";
}

export function getTrickWinner(state: Pick<GameStateView, "trickWinnerPlayer" | "players">): ViewPlayer | null {
  return state.trickWinnerPlayer == null ? null : state.players[state.trickWinnerPlayer] || null;
}

export function getLastTrick(state: Pick<GameStateView, "lastTrick">): LastTrick | null {
  return state.lastTrick || null;
}

export function orderedLastTrickCards(last: LastTrick | null | undefined): TrickPlay[] {
  const cards = Array.isArray(last?.cards) ? [...last.cards] : [];
  const leader = last?.leaderPlayer == null ? cards[0]?.player : last.leaderPlayer;
  const index = cards.findIndex(play => play.player === leader);
  if (index <= 0) return cards;
  return [...cards.slice(index), ...cards.slice(0, index)];
}

export function getRoundTableRows(table: RoundTable | null | undefined): RoundTablePlayerRow[] {
  if (!table || !Array.isArray(table.players)) return [];
  return table.players.map(row => ({
    ...row,
    receivedIdSet: new Set((row.receivedCards || []).map(card => card.id))
  }));
}

export function getRoundScores(players: readonly ViewPlayer[]) {
  return players.map((player, index) => ({
    player,
    index,
    round: Number(player.round || 0),
    total: Number(player.total || 0)
  }));
}

export function getRanking(players: readonly ViewPlayer[]): RankingItem[] {
  const scores = getRoundScores(players).sort((left, right) => left.total - right.total || left.round - right.round || left.index - right.index);
  const minTotal = scores.length ? scores[0].total : 0;
  return scores.map((item, index) => ({
    ...item,
    rank: index + 1,
    isWinner: item.total === minTotal
  }));
}

export function isRoundEnded(phase: string): boolean {
  return phase === "roundEnd" || phase === "gameEnd";
}

export function canStartNextRound(state: Pick<GameStateView, "phase">): boolean {
  return state.phase === "roundEnd";
}

export function canRestartGame(state: Pick<GameStateView, "phase" | "isHost">): boolean {
  return state.phase === "gameEnd" && Boolean(state.isHost);
}

export function getPlayableHint(state: GameStateView, card: Card | null | undefined): string {
  if (!card) return "这张牌当前不能出。";
  if (state.phase === "pass") {
    if (state.youPassed) return "你已经传过牌了，请等待其他玩家。";
    return "请先选择要传出的 3 张牌。";
  }
  if (state.phase !== "play") return "当前不是出牌阶段。";
  if (state.legalCardIds.has(card.id) && isMyTurn(state)) return `${cardName(card)} 可以出。`;
  return explainIllegalCard(card, state);
}

export function explainIllegalCard(card: Card, context: IllegalCardContext): string {
  if (context.phase === "pass") return context.youPassed ? "你已经传过牌了，请等待其他玩家。" : "请先选择要传出的 3 张牌。";
  if (context.phase !== "play") return "当前不是出牌阶段。";
  if (context.busy || context.comparingTrick || context.collectingTrick) return "正在结算本墩，请稍等。";
  if (context.currentPlayer !== 0) return "还没轮到你出牌。";

  const hand = context.hand || [];
  const leadSuit = context.trick?.[0]?.card?.suit || null;
  const isLeading = !leadSuit;
  const hasLeadSuit = Boolean(leadSuit && hand.some(item => item.suit === leadSuit));
  if (!isLeading && leadSuit && card.suit !== leadSuit && hasLeadSuit) return `本墩先出的是${SUITS[leadSuit].name}，你必须跟出同花色。`;

  const isFirstTrick = Number(context.trickNo || 0) === 0;
  const hasClub2 = hand.some(item => item.id === "C2" || (item.suit === "C" && Number(item.rank) === 2));
  if (isFirstTrick && isLeading && hasClub2 && card.id !== "C2") return "首轮首出必须先出梅花 2。";

  if (isFirstTrick && !isLeading && (card.suit === "H" || card.id === "S12")) {
    const onlyPenalty = hand.length > 0 && hand.every(item => item.suit === "H" || item.id === "S12");
    if (!onlyPenalty) return "第一墩不能垫红桃或黑桃 Q。";
  }

  const allHearts = hand.length > 0 && hand.every(item => item.suit === "H");
  if (isLeading && card.suit === "H" && !context.heartsBroken && !allHearts) return "红桃尚未破，暂时不能主动出红桃。";
  if (!context.legalCardIds.has(card.id)) return `${cardName(card)} 当前不符合出牌规则。`;
  return `${cardName(card)} 现在不能出。`;
}

export function cleanServerJudgeText(text: string): string {
  return cleanJudgeText(text);
}
