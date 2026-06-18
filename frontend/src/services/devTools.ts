import { currentGameState, dismissSpecialEvent, enqueueSpecialEvent, updateSettings } from "../stores/gameStore";
import type { SpecialEvent, SpecialEventLevel } from "../types/messages";

declare global {
  interface Window {
    __HEARTS_DEV__?: {
      triggerMoonEvent: () => SpecialEvent;
      triggerSpecialEvent: (level?: SpecialEventLevel) => SpecialEvent;
      setEffectsEnabled: (enabled: boolean) => void;
      clearSpecialEvents: () => void;
    };
  }
}

let devSeq = 900000;

function buildSpecialEvent(type: string, level: SpecialEventLevel, title: string, subtitle: string): SpecialEvent {
  const state = currentGameState();
  const player = state.players[state.currentPlayer] || state.players[0];
  devSeq += 1;
  return {
    seq: devSeq,
    round: state.roundNo || state.round || 1,
    type,
    level,
    title,
    subtitle,
    player: player?.name || "Dev Player",
    playerIndex: state.currentPlayer ?? 0,
    points: 26,
    at: Date.now()
  };
}

export function installDevTools(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;

  window.__HEARTS_DEV__ = {
    triggerMoonEvent() {
      const event = buildSpecialEvent("shootMoon", "legendary", "射中月亮", "开发验证：射月特殊事件");
      enqueueSpecialEvent(event);
      return event;
    },
    triggerSpecialEvent(level: SpecialEventLevel = "epic") {
      const event = buildSpecialEvent("highlight", level, "牌局高光", "开发验证：特殊事件提示");
      enqueueSpecialEvent(event);
      return event;
    },
    setEffectsEnabled(enabled: boolean) {
      updateSettings({ effectsEnabled: enabled });
    },
    clearSpecialEvents() {
      dismissSpecialEvent();
    }
  };
}
