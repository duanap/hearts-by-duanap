import { get, writable } from "svelte/store";
import type {
  AiBusyAction,
  Card,
  ConnectionState,
  DisplayInteractionEvent,
  GamePhase,
  GameStateShape,
  InteractionEvent,
  InteractionMenuAnchor,
  InteractionPayload,
  InteractionType,
  LastTrick,
  LocalUiState,
  LogItem,
  ModalKey,
  PassFlow,
  PlayerId,
  PlayerState,
  RoomCode,
  RoomBusyAction,
  RoundTable,
  ScoreState,
  SeatState,
  ServerMessage,
  SettingsState,
  SpecialEvent,
  StateMessage,
  ToastType,
  TrickPlay
} from "../types/messages";
import {
  PASS_HINTS,
  PASS_NAMES,
  SUITS,
  VIEW_AVATAR_CLASSES,
  VIEW_AVATARS,
  cardName,
  cardVisualClass,
  rankText
} from "../utils/cards";
import type { ViewPlayer } from "../utils/gameState";
import {
  absToViewIndex,
  buildScores,
  buildViewPlayers,
  canSelectPassCard,
  cleanServerJudgeText,
  createPlaceholderPlayers,
  explainIllegalCard,
  mapTrickToView,
  normalizeLastTrick,
  viewToAbsIndex
} from "../utils/gameState";
import {
  interactionCooldownKey,
  interactionCooldownRemaining,
  interactionEventKey,
  interactionItemByKind
} from "../utils/interactions";
import type { InteractionItem } from "../utils/interactions";
import { currentLayoutState, type LayoutState } from "../services/layout";
import { centerInteractionAnchor } from "../utils/geometry";

export { PASS_HINTS, PASS_NAMES, SUITS, VIEW_AVATAR_CLASSES, VIEW_AVATARS, cardName, cardVisualClass, rankText };
export type { ViewPlayer };

const storage = typeof localStorage === "undefined" ? null : localStorage;

export const CLIENT_ID_KEY = "hearts-online-client-id";
export const ROOM_ID_KEY = "hearts-online-room-id";
export const RECONNECT_TOKEN_KEY = "hearts-online-reconnect-token";
export const NICKNAME_KEY = "hearts-online-nickname";
export const FORCE_LANDSCAPE_KEY = "hearts-online-force-landscape";
export const SOUND_KEY = "hearts-online-sound";
export const SOUND_VOLUME_KEY = "hearts-online-sound-volume";
export const EFFECTS_KEY = "hearts-online-effects";
export const EFFECT_SPEED_KEY = "hearts-online-effect-speed";
export const INTERACTION_EFFECTS_KEY = "hearts-online-interaction-effects";
export const INTERACTION_SOUND_KEY = "hearts-online-interaction-sound";
export const INTERACTION_ENABLED_KEY = "hearts-online-interaction-enabled";
export const ALLOW_TOMATO_KEY = "hearts-online-allow-tomato";
export const LANDSCAPE_PROMPT_ENABLED_KEY = "hearts-online-landscape-prompt-enabled";

const MODAL_KEYS: ModalKey[] = [
  "room",
  "settings",
  "log",
  "rules",
  "result",
  "replay",
  "roundTable",
  "connection",
  "aiPrompt",
  "landscapePrompt",
  "versionLog",
  "debug",
  "interaction"
];

let toastTimer: number | null = null;
let receivedHighlightTimer: number | null = null;
let handTipTimer: number | null = null;

export interface GameState extends GameStateShape, LocalUiState {
  serverState: StateMessage | null;
  roomId: RoomCode;
  connected: boolean;
  connecting: boolean;
  hostId: PlayerId;
  yourIndex: number;
  isHost: boolean;
  serverPlayers: PlayerState[];
  players: ViewPlayer[];
  roundNo: number;
  passMode: number;
  trickNo: number;
  currentPlayer: number;
  heartsBroken: boolean;
  busy: boolean;
  gameOver: boolean;
  moonShooter: number | null;
  forceLandscape: boolean;
  layout: LayoutState;
  orientationLocked: boolean;
  screenPreflightActive: boolean;
  comparingTrick: boolean;
  collectingTrick: boolean;
  trickWinnerPlayer: number | null;
  judgeText: string;
  legalCardIds: Set<string>;
  selectedPass: Set<string>;
  youPassed: boolean;
  log: LogItem[];
  receivedCards: Card[];
  receivedFrom: string;
  lastReceiveKey: string;
  lastGameEndKey: string;
  actionToast: string;
  offlineBanner: string;
  lastAiPromptKey: string;
  lastSpecialEventSeq: number;
  specialEventRoomId: RoomCode;
  lastInteractionSeq: number;
  interactionRoomId: RoomCode;
  lastLocalInteractionKey: string;
  resultAutoOpenKey: string;
}

function boolFromStorage(key: string, fallback = true): boolean {
  const value = storage?.getItem(key);
  if (value == null) return fallback;
  return value !== "0";
}

function numberFromStorage(key: string, fallback: number, min: number, max: number): number {
  const value = Number(storage?.getItem(key) ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function createModals(active: ModalKey | null = null): Record<ModalKey, boolean> {
  return MODAL_KEYS.reduce((result, key) => {
    result[key] = key === active;
    return result;
  }, {} as Record<ModalKey, boolean>);
}

function createSettings(): SettingsState {
  return {
    soundEnabled: boolFromStorage(SOUND_KEY, true),
    soundVolume: numberFromStorage(SOUND_VOLUME_KEY, 1, 0, 1),
    effectsEnabled: boolFromStorage(EFFECTS_KEY, true),
    effectSpeed: numberFromStorage(EFFECT_SPEED_KEY, 1, 0.7, 1.4),
    interactionEffectsEnabled: boolFromStorage(INTERACTION_EFFECTS_KEY, true),
    interactionSoundEnabled: boolFromStorage(INTERACTION_SOUND_KEY, true),
    interactionEnabled: boolFromStorage(INTERACTION_ENABLED_KEY, true),
    allowTomato: boolFromStorage(ALLOW_TOMATO_KEY, true),
    landscapePromptEnabled: boolFromStorage(LANDSCAPE_PROMPT_ENABLED_KEY, true),
    bgmEnabled: false,
    bgmVolume: 0.35
  };
}

function createConnection(): ConnectionState {
  return {
    connected: false,
    connecting: false,
    reconnectAttempt: 0,
    lastDisconnectedAt: 0,
    lastPongAt: 0,
    manualClosed: false,
    error: ""
  };
}

export function ensureClientId(): string {
  const existing = storage?.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const id = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storage?.setItem(CLIENT_ID_KEY, id);
  return id;
}

function createInitialState(): GameState {
  const players = createPlaceholderPlayers();
  const roomId = storage?.getItem(ROOM_ID_KEY) || "";
  const selectedCardIds = new Set<string>();
  const settings = createSettings();
  const connection = createConnection();
  const layout = currentLayoutState();

  return {
    serverState: null,
    roomCode: roomId,
    roomId,
    playerId: ensureClientId(),
    hostId: "",
    yourIndex: 0,
    isHost: false,
    serverPlayers: [],
    players,
    seats: buildSeats(players, 0, "offline"),
    hand: players[0]?.hand || [],
    scores: buildScores(players),
    round: 1,
    roundNo: 1,
    passMode: 0,
    phase: "offline",
    trickNo: 0,
    trick: [],
    currentTurn: 0,
    currentPlayer: 0,
    heartsBroken: false,
    busy: false,
    gameOver: false,
    moonShooter: null,
    forceLandscape: storage?.getItem(FORCE_LANDSCAPE_KEY) === "1",
    layout,
    orientationLocked: false,
    screenPreflightActive: false,
    comparingTrick: false,
    collectingTrick: false,
    trickWinnerPlayer: null,
    judgeText: "",
    legalCardIds: new Set<string>(),
    selectedCardIds,
    selectedPass: selectedCardIds,
    passSending: false,
    passingCardIds: new Set<string>(),
    playSending: false,
    lastTrickOpen: false,
    fullscreenActive: false,
    youPassed: false,
    log: [],
    logs: [],
    passFlow: null,
    lastTrick: null,
    roundTable: null,
    receivedCards: [],
    receivedFrom: "",
    receivedHighlightIds: new Set<string>(),
    lastReceiveKey: "",
    lastGameEndKey: "",
    resultAutoOpenKey: "",
    interactions: [],
    interactionPanel: {
      open: false,
      mode: null,
      targetViewIndex: 0,
      x: 0,
      y: 0,
      placement: "center"
    },
    interactionCooldowns: {},
    interactionQueue: [],
    specialEvents: [],
    specialEventQueue: [],
    lastSpecialEventSeq: 0,
    specialEventRoomId: "",
    lastInteractionSeq: 0,
    interactionRoomId: "",
    lastLocalInteractionKey: "",
    actionToast: "",
    toast: "",
    toastType: "info",
    handTip: "",
    handTipType: "info",
    offlineBanner: "",
    connection,
    connected: connection.connected,
    connecting: connection.connecting,
    connectionManualClosed: false,
    roomError: "",
    roomBusy: null,
    aiBusy: null,
    activeModal: null,
    modals: createModals(),
    settings,
    aiPromptAction: null,
    aiPromptTitle: "",
    aiPromptSubtitle: "",
    aiPromptButton: "",
    lastAiPromptKey: ""
  };
}

function buildSeats(players: readonly ViewPlayer[], currentPlayer: number, phase: GamePhase): SeatState[] {
  return players.map(player => ({
    absIndex: player.absIndex,
    viewIndex: player.viewIndex,
    position: player.position,
    player,
    isSelf: player.viewIndex === 0,
    isCurrentTurn: phase === "play" && currentPlayer === player.viewIndex
  }));
}

export const gameState = writable<GameState>(createInitialState());

export function currentGameState(): GameState {
  return get(gameState);
}

export function absToView(absIndex: number | null | undefined, yourIndex = get(gameState).yourIndex): number {
  return absToViewIndex(absIndex, yourIndex);
}

export function viewToAbs(viewIndex: number, yourIndex = get(gameState).yourIndex): number {
  return viewToAbsIndex(viewIndex, yourIndex);
}

function withToastState(state: GameState, message: string, type: ToastType = "info"): GameState {
  return { ...state, toast: message, toastType: type, actionToast: message };
}

function shouldUseRoomInlineError(state: GameState, message: string): boolean {
  return state.activeModal === "room" && /房间|4 位|4位|已满|牌局/.test(message);
}

function clearReceivedHighlightLater(): void {
  if (typeof window === "undefined") return;
  if (receivedHighlightTimer != null) window.clearTimeout(receivedHighlightTimer);
  receivedHighlightTimer = window.setTimeout(() => {
    gameState.update(state => ({
      ...state,
      receivedHighlightIds: new Set<string>()
    }));
    receivedHighlightTimer = null;
  }, 3600);
}

export function applyServerState(msg: StateMessage): void {
  let receivedTip = "";
  gameState.update(state => {
    const oldPhase = state.phase;
    const yourIndex = Number.isInteger(msg.yourIndex) ? msg.yourIndex : 0;
    const roomId = msg.roomId || state.roomId;
    const serverPlayers = msg.players || [];
    const players = buildViewPlayers(serverPlayers, yourIndex);
    const phase = msg.phase || "lobby";
    const currentPlayer = absToViewIndex(msg.currentPlayer, yourIndex);
    const trickWinnerPlayer = msg.trickWinnerPlayer == null ? null : absToViewIndex(msg.trickWinnerPlayer, yourIndex);
    const moonShooter = msg.moonShooter == null ? null : absToViewIndex(msg.moonShooter, yourIndex);
    const trick = mapTrickToView(msg.trick || [], yourIndex);
    const you = serverPlayers[yourIndex];
    const youPassed = Boolean(you?.passed);
    const receivedCards = msg.receivedCards || [];
    const receiveKey = `${roomId}:${Number(msg.roundNo || 1)}:${receivedCards.map(card => card.id).join("|")}`;
    const hasNewReceivedCards = Boolean(receivedCards.length && receiveKey !== state.lastReceiveKey);
    const selectedCardIds = phase === "pass" ? new Set(state.selectedCardIds) : new Set<string>();
    const shouldClearPassing = youPassed || oldPhase === "pass" && phase !== "pass";
    const previousSpecialSeq = state.specialEventRoomId === roomId ? state.lastSpecialEventSeq : Math.max(0, ...(msg.specialEvents || []).map(item => Number(item.seq || 0)));
    const freshSpecialEvents = state.specialEventRoomId === roomId
      ? (msg.specialEvents || []).filter(item => Number(item.seq || 0) > state.lastSpecialEventSeq).sort((left, right) => Number(left.seq || 0) - Number(right.seq || 0))
      : [];
    const lastSpecialEventSeq = freshSpecialEvents.length
      ? Math.max(state.lastSpecialEventSeq, ...freshSpecialEvents.map(item => Number(item.seq || 0)))
      : previousSpecialSeq;
    const incomingInteractions = msg.interactions || [];
    const previousInteractionSeq = state.interactionRoomId === roomId
      ? state.lastInteractionSeq
      : Math.max(0, ...incomingInteractions.map(item => Number(item.seq || 0)));
    const freshInteractions = state.interactionRoomId === roomId
      ? incomingInteractions
        .filter(item => Number(item.seq || 0) > state.lastInteractionSeq)
        .sort((left, right) => Number(left.seq || 0) - Number(right.seq || 0))
      : [];
    const displayInteractions: DisplayInteractionEvent[] = freshInteractions.map(item => ({
      ...item,
      fromView: absToViewIndex(item.fromIndex, yourIndex),
      toView: absToViewIndex(item.toIndex, yourIndex)
    }));
    const lastInteractionSeq = freshInteractions.length
      ? Math.max(state.lastInteractionSeq, ...freshInteractions.map(item => Number(item.seq || 0)))
      : previousInteractionSeq;
    const connection: ConnectionState = {
      ...state.connection,
      connected: true,
      connecting: false,
      error: "",
      lastPongAt: state.connection.lastPongAt || Date.now()
    };

    if (roomId) storage?.setItem(ROOM_ID_KEY, roomId);
    if (msg.reconnectToken) storage?.setItem(RECONNECT_TOKEN_KEY, msg.reconnectToken);
    if (hasNewReceivedCards) clearReceivedHighlightLater();
    if (hasNewReceivedCards) {
      receivedTip = `你从${msg.receivedFrom || "其他玩家"}收到：${receivedCards.map(cardName).join("、")}`;
    }
    const shouldCloseRoomModal = state.modals.room && oldPhase === "lobby" && phase !== "lobby" && phase !== "offline";

    return {
      ...state,
      serverState: msg,
      roomCode: roomId,
      roomId,
      hostId: msg.hostId || "",
      yourIndex,
      isHost: Boolean(msg.isHost),
      serverPlayers,
      players,
      seats: buildSeats(players, currentPlayer, phase),
      hand: players[0]?.hand || [],
      scores: buildScores(players),
      round: Number(msg.roundNo || 1),
      roundNo: Number(msg.roundNo || 1),
      passMode: Number(msg.passMode || 0),
      phase,
      trickNo: Number(msg.trickNo || 0),
      trick,
      currentTurn: currentPlayer,
      currentPlayer,
      heartsBroken: Boolean(msg.heartsBroken),
      busy: Boolean(msg.busy),
      gameOver: Boolean(msg.gameOver),
      moonShooter,
      comparingTrick: Boolean(msg.comparingTrick),
      collectingTrick: Boolean(msg.collectingTrick),
      trickWinnerPlayer,
      judgeText: cleanServerJudgeText(msg.judgeText || ""),
      legalCardIds: new Set(msg.legalCardIds || []),
      selectedCardIds,
      selectedPass: selectedCardIds,
      passSending: shouldClearPassing ? false : state.passSending,
      passingCardIds: shouldClearPassing ? new Set<string>() : new Set(state.passingCardIds),
      playSending: false,
      youPassed,
      log: msg.log || [],
      logs: msg.log || [],
      passFlow: msg.passFlow || null,
      lastTrick: normalizeLastTrick(msg.lastTrick || null, yourIndex),
      roundTable: msg.roundTable || null,
      receivedCards,
      receivedFrom: msg.receivedFrom || "",
      receivedHighlightIds: hasNewReceivedCards ? new Set(receivedCards.map(card => card.id)) : state.receivedHighlightIds,
      lastReceiveKey: hasNewReceivedCards ? receiveKey : state.lastReceiveKey,
      interactions: incomingInteractions,
      interactionQueue: [...state.interactionQueue, ...displayInteractions],
      lastInteractionSeq,
      interactionRoomId: roomId,
      specialEvents: msg.specialEvents || [],
      specialEventQueue: [...state.specialEventQueue, ...freshSpecialEvents],
      lastSpecialEventSeq,
      specialEventRoomId: roomId,
      offlineBanner: "",
      connected: true,
      connecting: false,
      connection,
      roomError: "",
      roomBusy: null,
      aiBusy: null,
      activeModal: shouldCloseRoomModal && state.activeModal === "room" ? null : state.activeModal,
      modals: shouldCloseRoomModal ? { ...state.modals, room: false } : state.modals
    };
  });
  if (receivedTip) showHandTip(receivedTip, 3600, "success");
  maybePromptAiTakeover();
  maybeOpenResultOnRoundEnd();
}

export function handleRoomCreated(message: Extract<ServerMessage, { type: "roomCreated" }>): void {
  storage?.setItem(ROOM_ID_KEY, message.roomId);
  if (message.reconnectToken) storage?.setItem(RECONNECT_TOKEN_KEY, message.reconnectToken);
  gameState.update(state => ({
    ...state,
    roomCode: message.roomId,
    roomId: message.roomId,
    roomError: "",
    roomBusy: null,
    activeModal: state.activeModal === "room" ? "room" : state.activeModal,
    modals: { ...state.modals, room: true }
  }));
  showToast(`房间创建成功：${message.roomId}`, 1800, "success");
}

export function resetLocalRoom(message = "已退出房间。"): void {
  storage?.removeItem(ROOM_ID_KEY);
  storage?.removeItem(RECONNECT_TOKEN_KEY);
  gameState.update(state => {
    const base = createInitialState();
    return withToastState({
      ...base,
      playerId: state.playerId,
      connected: state.connected,
      connecting: state.connecting,
      connection: state.connection,
      forceLandscape: state.forceLandscape,
      layout: state.layout,
      fullscreenActive: state.fullscreenActive,
      settings: state.settings,
      roomBusy: null,
      aiBusy: null,
      activeModal: "room",
      modals: { ...base.modals, room: true }
    }, message);
  });
}

export function handleRoomClosed(message: Extract<ServerMessage, { type: "roomClosed" }>): void {
  const current = get(gameState);
  if (message.roomId && current.roomId && message.roomId !== current.roomId) return;
  resetLocalRoom(message.message || "房间已关闭。");
}

export function handleLeftRoom(message: Extract<ServerMessage, { type: "leftRoom" }>): void {
  resetLocalRoom(message.message || "已退出房间。");
}

export function handleError(message: Extract<ServerMessage, { type: "error" }>): void {
  const text = message.message || "操作失败";
  gameState.update(state => {
    const next = withToastState(state, text, shouldUseRoomInlineError(state, text) ? "warning" : "error");
    return {
      ...next,
      roomError: shouldUseRoomInlineError(state, text) ? text : state.roomError,
      roomBusy: null,
      aiBusy: null,
      passSending: false,
      playSending: false,
      passingCardIds: new Set<string>()
    };
  });
}

export function setConnected(): void {
  gameState.update(state => {
    const connection = { ...state.connection, connected: true, connecting: false, error: "", lastPongAt: Date.now() };
    return {
      ...state,
      connected: true,
      connecting: false,
      connection,
      connectionManualClosed: false,
      offlineBanner: "",
      activeModal: state.activeModal === "connection" ? null : state.activeModal,
      modals: { ...state.modals, connection: false }
    };
  });
}

export function setDisconnected(connecting = false, error = ""): void {
  gameState.update(state => {
    const connection = {
      ...state.connection,
      connected: false,
      connecting,
      lastDisconnectedAt: connecting ? state.connection.lastDisconnectedAt : Date.now(),
      error
    };
    return {
      ...state,
      connected: false,
      connecting,
      connection,
      offlineBanner: connecting ? "网络已断开，正在自动重连..." : "网络已断开，可尝试重连。"
    };
  });
}

export function recordPong(at = Date.now()): void {
  gameState.update(state => ({
    ...state,
    connection: {
      ...state.connection,
      lastPongAt: Number(at || Date.now())
    }
  }));
}

export function setConnectionStatus(connected: boolean, connecting = false, error = ""): void {
  if (connected) setConnected();
  else setDisconnected(connecting, error);
}

export function setConnectionModalOpen(open: boolean, manual = true): void {
  gameState.update(state => ({
    ...state,
    connectionManualClosed: manual && !open ? true : state.connectionManualClosed,
    activeModal: open ? "connection" : state.activeModal === "connection" ? null : state.activeModal,
    modals: { ...state.modals, connection: open }
  }));
}

export function selectCard(cardId: string): void {
  toggleCardSelection(cardId);
}

export function toggleCardSelection(cardId: string): void {
  const state = get(gameState);
  if (state.phase === "pass") selectForPass(cardId);
  else selectForPlay(cardId);
}

export function selectForPass(cardId: string): void {
  let blockedMessage = "";
  gameState.update(state => {
    if (state.phase !== "pass") {
      blockedMessage = "当前不是传牌阶段。";
      return state;
    }
    if (state.youPassed) {
      blockedMessage = "你已经传过牌了，请等待其他玩家。";
      return state;
    }
    if (state.passSending) {
      blockedMessage = "传牌中，请稍等。";
      return state;
    }
    if (!canSelectPassCard(state, cardId)) {
      blockedMessage = "最多只能选择 3 张牌。";
      return state;
    }

    const selectedCardIds = new Set(state.selectedCardIds);
    if (selectedCardIds.has(cardId)) selectedCardIds.delete(cardId);
    else selectedCardIds.add(cardId);
    return { ...state, selectedCardIds, selectedPass: selectedCardIds };
  });
  if (blockedMessage) showHandTip(blockedMessage, 1700, "warning");
}

export function selectForPlay(cardId: string): void {
  const selectedCardIds = new Set<string>([cardId]);
  gameState.update(state => ({ ...state, selectedCardIds, selectedPass: state.selectedPass }));
}

export function clearSelection(): void {
  clearCardSelection();
}

export function clearCardSelection(): void {
  gameState.update(state => ({
    ...state,
    selectedCardIds: new Set<string>(),
    selectedPass: new Set<string>()
  }));
}

export function setPassSending(sending: boolean): void {
  gameState.update(state => ({
    ...state,
    passSending: sending,
    passingCardIds: sending ? new Set(state.passingCardIds) : new Set<string>()
  }));
}

export function markPassingCards(cardIds: readonly string[]): void {
  const ids = new Set(cardIds);
  gameState.update(state => ({
    ...state,
    passingCardIds: ids,
    selectedCardIds: ids,
    selectedPass: ids
  }));
}

export function markPassSending(cardIds: readonly string[]): void {
  markPassingCards(cardIds);
  gameState.update(state => ({
    ...state,
    passSending: true
  }));
}

export function clearPassSending(): void {
  gameState.update(state => ({
    ...state,
    passSending: false,
    passingCardIds: new Set<string>()
  }));
}

export function markReceivedCards(cards: readonly Card[], from = ""): void {
  const ids = new Set(cards.map(card => card.id));
  gameState.update(state => ({
    ...state,
    receivedCards: [...cards],
    receivedFrom: from,
    receivedHighlightIds: ids
  }));
  clearReceivedHighlightLater();
  if (cards.length) showHandTip(`你从${from || "其他玩家"}收到：${cards.map(cardName).join("、")}`, 3600, "success");
}

export function clearReceivedHighlights(): void {
  gameState.update(state => ({
    ...state,
    receivedHighlightIds: new Set<string>()
  }));
}

export function setPlaySending(sending: boolean): void {
  gameState.update(state => ({
    ...state,
    playSending: sending
  }));
}

export function applyPlayError(message?: string, card?: Card): void {
  const state = get(gameState);
  const text = message || (card ? explainIllegalCard(card, state) : "这张牌当前不能出。");
  gameState.update(value => ({
    ...value,
    playSending: false,
    passSending: false,
    passingCardIds: new Set<string>()
  }));
  showHandTip(text, 1900, "warning");
}

export function showToast(message: string, duration = 1800, type: ToastType = "info"): void {
  gameState.update(state => withToastState(state, message, type));
  if (typeof window === "undefined") return;
  if (toastTimer != null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    gameState.update(state => ({ ...state, toast: "", actionToast: "", toastType: "info" }));
    toastTimer = null;
  }, Math.max(900, duration));
}

export function showHandTip(message: string, duration = 1700, type: ToastType = "info"): void {
  gameState.update(state => ({ ...state, handTip: message, handTipType: type }));
  if (typeof window === "undefined") return;
  if (handTipTimer != null) window.clearTimeout(handTipTimer);
  handTipTimer = window.setTimeout(() => {
    gameState.update(state => ({ ...state, handTip: "", handTipType: "info" }));
    handTipTimer = null;
  }, Math.max(900, duration));
}

export function clearHandTip(): void {
  if (typeof window !== "undefined" && handTipTimer != null) window.clearTimeout(handTipTimer);
  handTipTimer = null;
  gameState.update(state => ({ ...state, handTip: "", handTipType: "info" }));
}

export function openModal(key: ModalKey): void {
  gameState.update(state => ({
    ...state,
    activeModal: key,
    modals: { ...state.modals, [key]: true },
    interactionPanel: { ...state.interactionPanel, open: false, mode: null }
  }));
}

export function closeModal(key: ModalKey): void {
  gameState.update(state => {
    const modals = { ...state.modals, [key]: false };
    return {
      ...state,
      activeModal: state.activeModal === key ? null : state.activeModal,
      modals
    };
  });
}

export function openSettingsModal(): void {
  openModal("settings");
}

export function openLogModal(): void {
  openModal("log");
}

export function openRulesModal(): void {
  openModal("rules");
}

export function openVersionLogModal(): void {
  openModal("versionLog");
}

export function openResultModal(): void {
  openModal("result");
}

export function closeResultModal(): void {
  closeModal("result");
}

export function openRoundTableModal(): void {
  gameState.update(state => ({
    ...state,
    activeModal: "roundTable",
    modals: { ...state.modals, roundTable: true, result: false }
  }));
}

export function closeRoundTableModal(): void {
  closeModal("roundTable");
}

export function openLastTrick(): void {
  gameState.update(state => ({ ...state, lastTrickOpen: true }));
}

export function closeLastTrick(): void {
  gameState.update(state => ({ ...state, lastTrickOpen: false }));
}

export function maybeOpenResultOnRoundEnd(): void {
  gameState.update(state => {
    if (state.phase !== "roundEnd" && state.phase !== "gameEnd") return state;
    const key = `${state.roomId}:${state.roundNo}:${state.phase}`;
    if (state.resultAutoOpenKey === key) return state;
    return {
      ...state,
      resultAutoOpenKey: key,
      activeModal: "result",
      modals: { ...state.modals, result: true }
    };
  });
}

export function clearTrickHighlightState(): void {
  gameState.update(state => ({
    ...state,
    comparingTrick: false,
    collectingTrick: false,
    trickWinnerPlayer: null,
    judgeText: ""
  }));
}

export function clearRoomError(): void {
  gameState.update(state => ({ ...state, roomError: "" }));
}

export function setRoomBusy(action: RoomBusyAction): void {
  gameState.update(state => ({ ...state, roomBusy: action }));
}

export function setAiBusy(action: AiBusyAction): void {
  gameState.update(state => ({ ...state, aiBusy: action }));
}

export function resetRoomLocalState(message = "已清空本地房间状态。"): void {
  resetLocalRoom(message);
}

function playerDisplayList(players: readonly PlayerState[]): string {
  return players.map(player => player.name || "玩家").join("、");
}

export function maybePromptAiTakeover(): void {
  gameState.update(state => {
    if (!state.roomId || !state.isHost || state.phase === "gameEnd") {
      return {
        ...state,
        aiPromptAction: null,
        aiPromptTitle: "",
        aiPromptSubtitle: "",
        aiPromptButton: "",
        modals: { ...state.modals, aiPrompt: false },
        activeModal: state.activeModal === "aiPrompt" ? null : state.activeModal
      };
    }

    const leftPlayers = state.serverPlayers.filter(player => !player.isBot && player.leftRoom);
    const offlinePlayers = state.serverPlayers.filter(player => !player.isBot && !player.connected && !player.leftRoom);
    let action: AiBusyAction = null;
    let title = "";
    let subtitle = "";
    let button = "";
    let names: string[] = [];

    if (leftPlayers.length) {
      action = "fill";
      names = leftPlayers.map(player => player.name || "玩家");
      title = "有玩家已退出";
      subtitle = `${playerDisplayList(leftPlayers)} 已主动退出房间，可使用 AI 补位接管其当前手牌，避免牌局卡住。`;
      button = "AI补位";
    } else if (offlinePlayers.length) {
      action = "takeover";
      names = offlinePlayers.map(player => player.name || "玩家");
      title = "有玩家已离线";
      subtitle = `${playerDisplayList(offlinePlayers)} 与服务器断开连接，可使用 AI 接管离线座位，后续玩家可用相同昵称重新加入并取代 AI。`;
      button = "AI接管离线";
    }

    if (!action) {
      return {
        ...state,
        aiPromptAction: null,
        aiPromptTitle: "",
        aiPromptSubtitle: "",
        aiPromptButton: "",
        modals: { ...state.modals, aiPrompt: false },
        activeModal: state.activeModal === "aiPrompt" ? null : state.activeModal
      };
    }

    const key = `${state.roomId}:${state.phase}:${action}:${names.join("|")}`;
    if (state.lastAiPromptKey === key) return state;

    return {
      ...state,
      lastAiPromptKey: key,
      aiPromptAction: action,
      aiPromptTitle: title,
      aiPromptSubtitle: subtitle,
      aiPromptButton: button,
      activeModal: "aiPrompt",
      modals: { ...state.modals, aiPrompt: true }
    };
  });
}

export interface SendInteractionOptions {
  targetViewIndex?: number;
  itemOverride?: InteractionItem;
  globalCooldown?: boolean;
}

export interface PreparedInteraction {
  payload: InteractionPayload;
  event: DisplayInteractionEvent;
}

function defaultInteractionAnchor(mode: "quick" | "target" = "target"): InteractionMenuAnchor {
  if (mode === "quick") return centerInteractionAnchor();
  const center = centerInteractionAnchor();
  return { ...center, placement: "above" };
}

function playerInteractionLabel(state: GameState, viewIndex: number): string {
  const player = state.players[viewIndex];
  if (viewIndex === 0) return player?.name && player.name !== "等待中" ? player.name : "自己";
  return player?.name || ["本家", "上家", "对家", "下家"][viewIndex] || "玩家";
}

function canOpenTargetInteraction(state: GameState, targetViewIndex: number): string {
  if (!state.settings.interactionEnabled) return "互动已关闭，可在设置里开启。";
  if (!state.roomId) return "请先创建或加入房间。";
  if (targetViewIndex === 0) return "不能给自己发送互动。";
  const player = state.players[targetViewIndex];
  if (!player || !player.id || player.name === "等待中") return "该座位暂无玩家。";
  return "";
}

export function openInteractionPanel(
  targetViewIndex = 0,
  anchor: InteractionMenuAnchor = defaultInteractionAnchor("target"),
  mode: "quick" | "target" = "target"
): void {
  const state = get(gameState);
  if (!state.settings.interactionEnabled) {
    showToast("互动已关闭，可在设置里开启。", 1900, "warning");
    return;
  }
  if (mode === "target") {
    const blocked = canOpenTargetInteraction(state, targetViewIndex);
    if (blocked) {
      showToast(blocked, 1900, "warning");
      return;
    }
  }

  gameState.update(value => ({
    ...value,
    interactionPanel: {
      open: true,
      mode,
      targetViewIndex: Math.max(0, Math.min(3, Number(targetViewIndex || 0))),
      x: Math.round(anchor.x),
      y: Math.round(anchor.y),
      placement: anchor.placement
    }
  }));
}

export function openQuickInteractionPanel(anchor: InteractionMenuAnchor = defaultInteractionAnchor("quick")): void {
  openInteractionPanel(0, anchor, "quick");
}

export function closeInteractionPanel(): void {
  gameState.update(state => ({
    ...state,
    interactionPanel: { ...state.interactionPanel, open: false, mode: null }
  }));
}

export function sendInteraction(kind: InteractionType, options: SendInteractionOptions = {}): PreparedInteraction | null {
  const state = get(gameState);
  const item = options.itemOverride || interactionItemByKind(kind);
  const targetViewIndex = Math.max(0, Math.min(3, Number(options.targetViewIndex ?? state.interactionPanel.targetViewIndex ?? 0)));
  const globalCooldown = Boolean(options.globalCooldown);

  if (!state.settings.interactionEnabled) {
    showToast("互动已关闭，可在设置里开启。", 1900, "warning");
    return null;
  }
  if (!state.roomId) {
    showToast("请先创建或加入房间。", 1900, "warning");
    return null;
  }
  if (!globalCooldown) {
    const blocked = canOpenTargetInteraction(state, targetViewIndex);
    if (blocked) {
      showToast(blocked, 1900, "warning");
      return null;
    }
  }
  if (item.kind === "tomato" && !state.settings.allowTomato) {
    showToast("已关闭扔番茄互动，可在设置里开启。", 1900, "warning");
    return null;
  }

  const remain = interactionCooldownRemaining(state.interactionCooldowns, item.kind, targetViewIndex, globalCooldown);
  if (remain) {
    showToast(`${item.label}还需 ${remain} 秒冷却。`, 1800, "warning");
    return null;
  }

  const toIndex = viewToAbsIndex(targetViewIndex, state.yourIndex);
  const fromName = playerInteractionLabel(state, 0);
  const toName = playerInteractionLabel(state, targetViewIndex);
  const seq = Date.now();
  const payload: InteractionPayload = {
    kind: item.kind,
    icon: item.icon,
    label: item.label,
    toIndex
  };
  const event: DisplayInteractionEvent = {
    seq,
    round: state.roundNo,
    kind: item.kind,
    icon: item.icon,
    label: item.label,
    fromIndex: state.yourIndex,
    toIndex,
    from: fromName,
    to: toName,
    at: seq,
    fromView: 0,
    toView: targetViewIndex
  };

  const cooldownKey = interactionCooldownKey(item.kind, targetViewIndex, globalCooldown);
  gameState.update(value => ({
    ...value,
    interactionCooldowns: {
      ...value.interactionCooldowns,
      [cooldownKey]: Date.now() + Math.max(0, Number(item.cooldown || 1000))
    },
    interactionPanel: { ...value.interactionPanel, open: false, mode: null }
  }));

  return { payload, event };
}

export function enqueueInteraction(event: DisplayInteractionEvent): void {
  gameState.update(state => ({
    ...state,
    interactionQueue: [...state.interactionQueue, event],
    lastLocalInteractionKey: event.localOnly ? interactionEventKey(event) : state.lastLocalInteractionKey
  }));
}

export function dismissInteraction(seq?: number): void {
  gameState.update(state => ({
    ...state,
    interactionQueue: seq == null
      ? state.interactionQueue.slice(1)
      : state.interactionQueue.filter(event => event.seq !== seq)
  }));
}

export function clearInteractionQueue(): void {
  gameState.update(state => ({
    ...state,
    interactionQueue: []
  }));
}

export function setRoomId(roomId: string): void {
  storage?.setItem(ROOM_ID_KEY, roomId);
  gameState.update(state => ({ ...state, roomCode: roomId, roomId }));
}

export function togglePassSelection(cardId: string): void {
  selectCard(cardId);
}

export function clearPassSelection(): void {
  clearSelection();
}

export function setForceLandscape(enabled: boolean): void {
  storage?.setItem(FORCE_LANDSCAPE_KEY, enabled ? "1" : "0");
  gameState.update(state => ({ ...state, forceLandscape: enabled }));
}

export function setLayoutState(layout: LayoutState): void {
  const current = get(gameState);
  if (current.layout.layoutKey === layout.layoutKey && current.layout.forceLandscape === layout.forceLandscape) return;
  gameState.update(state => ({
    ...state,
    layout,
    screenPreflightActive: layout.isMobile
  }));
}

export function setOrientationLocked(locked: boolean): void {
  gameState.update(state => ({ ...state, orientationLocked: locked }));
}

export function setFullscreenActive(active: boolean): void {
  gameState.update(state => ({ ...state, fullscreenActive: active }));
}

export function showActionToast(message: string): void {
  showToast(message);
}

export function clearActionToast(): void {
  gameState.update(state => ({ ...state, toast: "", actionToast: "", toastType: "info" }));
}

export function savedNickname(): string {
  return storage?.getItem(NICKNAME_KEY) || "";
}

export function savedReconnectToken(): string {
  return storage?.getItem(RECONNECT_TOKEN_KEY) || "";
}

export function saveNickname(nickname: string): void {
  storage?.setItem(NICKNAME_KEY, nickname);
}

export function updateSettings(nextSettings: Partial<SettingsState>): void {
  gameState.update(state => {
    const settings = { ...state.settings, ...nextSettings };
    storage?.setItem(SOUND_KEY, settings.soundEnabled ? "1" : "0");
    storage?.setItem(SOUND_VOLUME_KEY, String(settings.soundVolume));
    storage?.setItem(EFFECTS_KEY, settings.effectsEnabled ? "1" : "0");
    storage?.setItem(EFFECT_SPEED_KEY, String(settings.effectSpeed));
    storage?.setItem(INTERACTION_EFFECTS_KEY, settings.interactionEffectsEnabled ? "1" : "0");
    storage?.setItem(INTERACTION_SOUND_KEY, settings.interactionSoundEnabled ? "1" : "0");
    storage?.setItem(INTERACTION_ENABLED_KEY, settings.interactionEnabled ? "1" : "0");
    storage?.setItem(ALLOW_TOMATO_KEY, settings.allowTomato ? "1" : "0");
    storage?.setItem(LANDSCAPE_PROMPT_ENABLED_KEY, settings.landscapePromptEnabled ? "1" : "0");
    return { ...state, settings };
  });
}

export function loadSettings(): void {
  gameState.update(state => ({ ...state, settings: createSettings() }));
}

export function saveSettings(settings: SettingsState): void {
  updateSettings(settings);
}

export async function clearClientCache(): Promise<void> {
  if (typeof window === "undefined") return;
  const confirmed = window.confirm("确定要刷新本地缓存吗？这只会清理当前浏览器缓存和 Svelte 版注册的 Service Worker，不会删除线上旧版文件。");
  if (!confirmed) return;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
    showToast("本地缓存已清理，刷新页面后生效。", 2600, "success");
  } catch (error) {
    console.warn("清理本地缓存失败", error);
    showToast("清理缓存失败，请稍后重试。", 2600, "error");
  }
}

export function enqueueSpecialEvent(event: SpecialEvent): void {
  gameState.update(state => ({
    ...state,
    specialEventQueue: [...state.specialEventQueue, event]
  }));
}

export function dismissSpecialEvent(seq?: number): void {
  gameState.update(state => {
    const [, ...rest] = state.specialEventQueue;
    return {
      ...state,
      specialEventQueue: seq == null
        ? rest
        : state.specialEventQueue.filter(event => event.seq !== seq)
    };
  });
}
