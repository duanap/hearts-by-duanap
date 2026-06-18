<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { dismissSpecialEvent } from "../../stores/gameStore";
  import type { SpecialEvent } from "../../types/messages";
  import { playSpecialEventAnimation } from "../../services/animationService";
  import { playGameSound } from "../../services/audio";
  import { absToViewIndex } from "../../utils/gameState";

  export let state: GameState;

  const levelNames: Record<string, string> = {
    minor: "提示",
    highlight: "高光",
    epic: "大事件",
    legendary: "传奇"
  };

  let currentSeq = 0;
  let activeEvent: SpecialEvent | null = null;
  let display = false;
  let moonDisplay = false;
  let hideTimer: number | null = null;
  let specialNode: HTMLElement | null = null;

  $: event = state.specialEventQueue[0] || null;

  $: if (event && !state.settings.effectsEnabled) {
    activeEvent = null;
    display = false;
    moonDisplay = false;
    document.body.classList.remove("moon-effect-active");
    dismissSpecialEvent(event.seq);
  }

  $: if (event && event.seq !== currentSeq && state.settings.effectsEnabled) {
    showEvent(event);
  }

  function showEvent(next: SpecialEvent): void {
    currentSeq = next.seq;
    activeEvent = next;
    display = true;
    moonDisplay = next.type === "shootMoon";
    if (hideTimer != null) window.clearTimeout(hideTimer);
    document.body.classList.toggle("moon-effect-active", next.type === "shootMoon");

    const level = next.level || "minor";
    if (level === "legendary" || next.type === "shootMoon") playGameSound("moon", state.settings);
    else if (level === "epic") playGameSound("trick", state.settings);
    else playGameSound("roundEnd", state.settings);

    const baseDuration = level === "legendary" ? 2350 : level === "epic" ? 2150 : 2000;
    const duration = Math.round(baseDuration * state.settings.effectSpeed);
    void tick().then(() => playSpecialEventAnimation(
      specialNode,
      next,
      { settings: state.settings, forceLandscape: state.forceLandscape, layout: state.layout },
      state.currentPlayer,
      resolveSpecialEventViewIndex
    ));
    hideTimer = window.setTimeout(() => {
      activeEvent = null;
      display = false;
      moonDisplay = false;
      document.body.classList.remove("moon-effect-active");
      dismissSpecialEvent(next.seq);
      hideTimer = null;
    }, duration);
  }

  function resolveSpecialEventViewIndex(next: SpecialEvent | null): number | null {
    if (!next) return null;
    if (Number.isInteger(next.playerIndex)) return absToViewIndex(Number(next.playerIndex), state.yourIndex);
    const name = String(next.player || "").split(/[、,，\s]+/).filter(Boolean)[0] || "";
    if (!name) return null;
    const absIndex = state.serverPlayers.findIndex(player => player?.name === name);
    return absIndex >= 0 ? absToViewIndex(absIndex, state.yourIndex) : null;
  }

  onDestroy(() => {
    if (hideTimer != null) window.clearTimeout(hideTimer);
    document.body.classList.remove("moon-effect-active");
  });
</script>

<div class="moon-effect" class:hidden={!moonDisplay} id="moonEffect">
  <div class="moon-orbit">
    <div class="moon-glow">🌕</div>
    <div class="moon-stars">✨ ✦ ✨</div>
    <div class="moon-title" id="moonTitle">射中月亮！</div>
    <div class="moon-subtitle" id="moonSubtitle">{event?.subtitle || "本局打满贯"}</div>
  </div>
</div>

<div
  class={`special-event ${event?.level || "minor"} type-${event?.type || "general"}`}
  class:hidden={!display}
  class:special-flying={display}
  id="specialEvent"
  aria-live="polite"
  bind:this={specialNode}
>
  <div class="special-event-level" id="specialEventLevel">{levelNames[event?.level || "minor"] || "高光"}</div>
  <div class="special-event-title" id="specialEventTitle">{event?.title || "牌局高光"}</div>
  <div class="special-event-subtitle" id="specialEventSubtitle">{event?.subtitle || "精彩时刻"}</div>
</div>
