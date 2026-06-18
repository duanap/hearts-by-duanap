import type { ClientMessage, InteractionPayload, RoomCode, ServerMessage } from "../types/messages";
import { ensureClientId, savedReconnectToken } from "../stores/gameStore";

interface WsStatus {
  connected: boolean;
  connecting: boolean;
  reconnectAttempt: number;
  error?: string;
}

interface WsClientOptions {
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onStatus?: (status: WsStatus) => void;
}

const HEARTBEAT_MS = 25_000;
const RECONNECT_DELAYS = [1200, 2000, 3500, 5000, 8000];

function wsUrlFromHttpOrigin(origin: string): string {
  const url = new URL(origin);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${url.host}`;
}

export function resolveWebSocketUrl(): string {
  const devOrigin = import.meta.env.DEV ? String(import.meta.env.VITE_WS_ORIGIN || "").trim() : "";
  if (devOrigin) return wsUrlFromHttpOrigin(devOrigin);

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${location.host}`;
}

class WsClient {
  private socket: WebSocket | null = null;
  private options: WsClientOptions | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectAttempt = 0;
  private manualClose = false;
  private readonly clientId = ensureClientId();

  connect(options?: WsClientOptions): void {
    if (options) this.options = options;
    if (!this.options) return;
    this.manualClose = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

    this.emitStatus(false, true);
    const socket = new WebSocket(resolveWebSocketUrl());
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (this.socket !== socket) return;
      this.reconnectAttempt = 0;
      this.emitStatus(true, false);
      this.options?.onOpen?.();
      this.startHeartbeat();
    });

    socket.addEventListener("message", event => {
      if (this.socket !== socket) return;
      try {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        this.options?.onMessage(message);
      } catch (error) {
        console.warn("WebSocket message parse failed", error);
      }
    });

    socket.addEventListener("close", () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.stopHeartbeat();
      this.emitStatus(false, false);
      if (!this.manualClose) this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      if (this.socket !== socket) return;
      this.emitStatus(false, false, "连接服务端失败。");
      try {
        socket.close();
      } catch {
        // Browser may already be closing the socket.
      }
    });
  }

  disconnect(): void {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer != null) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    try {
      this.socket?.close();
    } catch {
      // Ignore shutdown errors.
    }
    this.socket = null;
    this.emitStatus(false, false);
  }

  close(): void {
    this.disconnect();
  }

  reconnect(): void {
    this.disconnect();
    this.manualClose = false;
    this.connect();
  }

  send(message: ClientMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    const reconnectToken = savedReconnectToken();
    this.socket.send(JSON.stringify({
      ...message,
      clientId: this.clientId,
      ...(reconnectToken ? { reconnectToken } : {})
    }));
    return true;
  }

  hello(roomId?: RoomCode): boolean {
    return this.send({ type: "hello", roomId });
  }

  ping(): boolean {
    return this.send({ type: "ping", at: Date.now() });
  }

  createRoom(nickname: string): boolean {
    return this.send({ type: "createRoom", nickname });
  }

  joinRoom(roomId: RoomCode, nickname: string): boolean {
    return this.send({ type: "joinRoom", roomId, nickname });
  }

  leaveRoom(): boolean {
    return this.send({ type: "leaveRoom" });
  }

  disbandRoom(): boolean {
    return this.send({ type: "disbandRoom" });
  }

  fillBotsAndStart(): boolean {
    return this.send({ type: "fillBotsAndStart" });
  }

  takeoverOffline(): boolean {
    return this.send({ type: "takeoverOffline" });
  }

  startGame(): boolean {
    return this.send({ type: "startGame" });
  }

  passCards(cards: readonly string[]): boolean {
    return this.send({ type: "passCards", cards: [...cards] });
  }

  playCard(cardId: string): boolean {
    return this.send({ type: "playCard", cardId });
  }

  interaction(interaction: InteractionPayload): boolean {
    return this.send({ type: "interaction", interaction });
  }

  startNextRound(): boolean {
    return this.send({ type: "startNextRound" });
  }

  restartGame(): boolean {
    return this.send({ type: "restartGame" });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.ping();
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer != null) window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private scheduleReconnect(): void {
    if (!this.options || this.reconnectTimer != null) return;
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt += 1;
    this.emitStatus(false, true);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private emitStatus(connected: boolean, connecting: boolean, error = ""): void {
    this.options?.onStatus?.({
      connected,
      connecting,
      reconnectAttempt: this.reconnectAttempt,
      error
    });
  }
}

export const wsClient = new WsClient();
