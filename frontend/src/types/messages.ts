export type Suit = "C" | "D" | "S" | "H";
export type RoomCode = string;
export type PlayerId = string;

export type GamePhase = "offline" | "lobby" | "deal" | "pass" | "play" | "roundEnd" | "gameEnd" | (string & {});
export type SeatPosition = "south" | "west" | "north" | "east";
export type ModalKey =
  | "room"
  | "settings"
  | "log"
  | "rules"
  | "result"
  | "replay"
  | "roundTable"
  | "connection"
  | "aiPrompt"
  | "landscapePrompt"
  | "versionLog"
  | "debug"
  | "interaction";
export type ToastType = "info" | "success" | "warning" | "error";
export type RoomBusyAction = "create" | "join" | "leave" | "disband" | null;
export type AiBusyAction = "fill" | "takeover" | "approveTakeover" | "rejectTakeover" | null;
export type InteractionType =
  | "emoji"
  | "flower"
  | "tomato"
  | "like"
  | "applause"
  | "brick"
  | "slipper"
  | "cabbage"
  | "doge";
export type InteractionMenuMode = "quick" | "target" | null;
export type InteractionMenuPlacement = "above" | "below" | "left" | "right" | "center";

export interface Card {
  suit: Suit;
  rank: number;
  id: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  avatar: string;
  isBot: boolean;
  aiControlled: boolean;
  connected: boolean;
  leftRoom: boolean;
  hand: Card[];
  handCount: number;
  round: number;
  total: number;
  passed: boolean;
}

export interface SeatState {
  absIndex: number;
  viewIndex: number;
  position: SeatPosition;
  player: PlayerState;
  isSelf: boolean;
  isCurrentTurn: boolean;
}

export interface TrickPlay {
  player: number;
  card: Card;
}

export interface PassFlow {
  seq: number;
  roundNo: number;
  passMode: number;
  flows: Array<{
    from: number;
    to: number;
    count: number;
  }>;
}

export interface InteractionPayload {
  kind: InteractionType;
  icon?: string;
  label?: string;
  toIndex: number;
}

export interface InteractionEvent {
  seq: number;
  round: number;
  kind: InteractionType;
  icon: string;
  label: string;
  fromIndex: number;
  toIndex: number;
  from: string;
  to: string;
  at: number;
}

export interface DisplayInteractionEvent extends InteractionEvent {
  fromView: number;
  toView: number;
  localOnly?: boolean;
}

export interface InteractionMenuAnchor {
  x: number;
  y: number;
  placement: InteractionMenuPlacement;
}

export interface InteractionPanelState {
  open: boolean;
  mode: InteractionMenuMode;
  targetViewIndex: number;
  x: number;
  y: number;
  placement: InteractionMenuPlacement;
}

export type SpecialEventLevel = "minor" | "highlight" | "epic" | "legendary" | (string & {});

export interface SpecialEvent {
  seq: number;
  round: number;
  type: string;
  level: SpecialEventLevel;
  title: string;
  subtitle: string;
  player: string;
  playerIndex: number | null;
  points: number;
  at: number;
}

export interface LastTrick {
  trickNo: number;
  leadSuit: Suit | "";
  leaderPlayer: number | null;
  winnerPlayer: number;
  winningRank: number;
  points: number;
  cards: TrickPlay[];
}

export interface RoundTablePlayer {
  index?: number;
  name: string;
  avatar: string;
  cards: Card[];
  receivedCards: Card[];
  passedCards: Card[];
  passedTo: string;
  round: number;
  total?: number;
}

export interface RoundTable {
  roundNo: number;
  passMode: number;
  passName: string;
  players: RoundTablePlayer[];
  tricks?: RoundTableTrick[];
}

export interface RoundTableTrick {
  trickNo: number;
  leadSuit?: Suit | "";
  winnerPlayer: number;
  points: number;
  cards: TrickPlay[];
}

export interface LogItem {
  round: number;
  text: string;
}

export interface ScoreState {
  playerId: PlayerId;
  name: string;
  round: number;
  total: number;
}

export interface SettingsState {
  soundEnabled: boolean;
  soundVolume: number;
  effectsEnabled: boolean;
  effectSpeed: number;
  interactionEffectsEnabled: boolean;
  interactionSoundEnabled: boolean;
  interactionEnabled: boolean;
  allowTomato: boolean;
  landscapePromptEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  reconnectAttempt: number;
  lastDisconnectedAt: number;
  lastPongAt: number;
  manualClosed: boolean;
  error: string;
}

export interface LocalUiState {
  selectedCardIds: Set<string>;
  passSending: boolean;
  passingCardIds: Set<string>;
  receivedHighlightIds: Set<string>;
  connectionManualClosed: boolean;
  roomError: string;
  roomBusy: RoomBusyAction;
  aiBusy: AiBusyAction;
  toast: string;
  toastType: ToastType;
  handTip: string;
  handTipType: ToastType;
  activeModal: ModalKey | null;
  modals: Record<ModalKey, boolean>;
  specialEventQueue: SpecialEvent[];
  interactionPanel: InteractionPanelState;
  interactionCooldowns: Record<string, number>;
  interactionQueue: DisplayInteractionEvent[];
  aiPromptAction: AiBusyAction;
  aiPromptTitle: string;
  aiPromptSubtitle: string;
  aiPromptButton: string;
  playSending: boolean;
  lastTrickOpen: boolean;
  fullscreenActive: boolean;
}

export interface GameStateShape {
  roomCode: RoomCode;
  playerId: PlayerId;
  players: PlayerState[];
  seats: SeatState[];
  hand: Card[];
  trick: TrickPlay[];
  scores: ScoreState[];
  round: number;
  phase: GamePhase;
  passFlow: PassFlow | null;
  currentTurn: number;
  lastTrick: LastTrick | null;
  roundTable: RoundTable | null;
  logs: LogItem[];
  settings: SettingsState;
  specialEvents: SpecialEvent[];
  interactions: InteractionEvent[];
  connection: ConnectionState;
}

export interface StateMessage {
  type: "state";
  roomId: RoomCode;
  reconnectToken?: string;
  yourIndex: number;
  hostId: PlayerId;
  isHost: boolean;
  phase: GamePhase;
  roundNo: number;
  passMode: number;
  passName: string;
  players: PlayerState[];
  trick: TrickPlay[];
  trickNo: number;
  currentPlayer: number;
  heartsBroken: boolean;
  busy: boolean;
  comparingTrick: boolean;
  collectingTrick: boolean;
  trickWinnerPlayer: number | null;
  judgeText: string;
  gameOver: boolean;
  moonShooter: number | null;
  legalCardIds: string[];
  receivedCards: Card[];
  receivedFrom: string;
  specialEvents: SpecialEvent[];
  interactions: InteractionEvent[];
  passFlow: PassFlow | null;
  lastTrick: LastTrick | null;
  roundTable: RoundTable | null;
  log: LogItem[];
}

export type ServerMessage =
  | StateMessage
  | { type: "pong"; at?: number }
  | { type: "roomCreated"; roomId: RoomCode; reconnectToken?: string }
  | { type: "roomClosed"; roomId?: RoomCode; message?: string }
  | { type: "leftRoom"; roomId?: RoomCode; message?: string }
  | { type: "takeoverRequested"; roomId: RoomCode; botName: string }
  | { type: "takeoverRejected"; roomId?: RoomCode; message?: string }
  | { type: "takeoverApprovalNeeded"; roomId: RoomCode; nickname: string; botName: string; botIndex: number }
  | { type: "error"; message?: string };

export type ClientMessage =
  | { type: "hello"; roomId?: RoomCode; reconnectToken?: string }
  | { type: "ping"; at?: number }
  | { type: "createRoom"; nickname: string; reconnectToken?: string }
  | { type: "joinRoom"; roomId: RoomCode; nickname: string; reconnectToken?: string }
  | { type: "leaveRoom" }
  | { type: "disbandRoom" }
  | { type: "fillBotsAndStart" }
  | { type: "takeoverOffline" }
  | { type: "requestTakeover"; botIndex: number }
  | { type: "approveTakeover" }
  | { type: "rejectTakeover" }
  | { type: "startGame" }
  | { type: "passCards"; cards: string[] }
  | { type: "playCard"; cardId: string }
  | { type: "interaction"; interaction: InteractionPayload }
  | { type: "startNextRound" }
  | { type: "restartGame" };
