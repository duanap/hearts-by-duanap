<script lang="ts">
  import { onDestroy } from "svelte";
  import type { DisplayInteractionEvent } from "../../types/messages";
  import type { GameState } from "../../stores/gameStore";
  import { dismissInteraction } from "../../stores/gameStore";
  import { playInteractionFlight } from "../../services/animationService";
  import { playInteractionSound } from "../../services/audio";
  import { formatInteractionLabel } from "../../utils/format";
  import { interactionBubbleAnchor } from "../../utils/geometry";

  export let state: GameState;

  let visible = false;
  let currentKey = "";
  let activeEvent: DisplayInteractionEvent | null = null;
  let point = { x: 0, y: 0 };
  let dismissTimer: number | null = null;
  let animationToken = 0;

  $: queuedEvent = state.interactionQueue[0] || null;
  $: if (queuedEvent && `${queuedEvent.seq}:${queuedEvent.fromIndex}:${queuedEvent.toIndex}:${queuedEvent.kind}:${queuedEvent.label}` !== currentKey) {
    showEvent(queuedEvent);
  } else if (!queuedEvent) {
    visible = false;
    activeEvent = null;
    currentKey = "";
  }

  $: bubbleStyle = `left:${point.x}px;top:${point.y}px;--screen-rot:${state.layout?.screenRotation ?? (state.forceLandscape ? 90 : 0)}deg;`;

  function clearTimer(): void {
    if (dismissTimer != null) window.clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  function showEvent(event: DisplayInteractionEvent): void {
    clearTimer();
    const token = ++animationToken;
    currentKey = `${event.seq}:${event.fromIndex}:${event.toIndex}:${event.kind}:${event.label}`;
    activeEvent = event;
    playInteractionSound(event.kind, state.settings);
    point = interactionBubbleAnchor(event.toView, state.forceLandscape, state.layout);
    visible = false;

    void playInteractionFlight(event, { settings: state.settings, forceLandscape: state.forceLandscape, layout: state.layout })
      .then(nextPoint => {
        if (token !== animationToken) return;
        point = nextPoint;
        visible = true;
        dismissTimer = window.setTimeout(() => {
          dismissInteraction(event.seq);
          dismissTimer = null;
        }, 2200);
      })
      .catch(() => {
        if (token !== animationToken) return;
        visible = true;
        dismissTimer = window.setTimeout(() => {
          dismissInteraction(event.seq);
          dismissTimer = null;
        }, 2200);
      });
  }

  onDestroy(clearTimer);
</script>

<div class="interaction-layer" id="interactionLayer" aria-hidden="true">
  {#if visible && activeEvent}
    <div class="interaction-bubble" style={bubbleStyle}>
      <span class="ib-icon">{activeEvent.icon || "💬"}</span>
      <span class="ib-label">{formatInteractionLabel(activeEvent.kind, activeEvent.label)}</span>
      <span class="ib-from">{activeEvent.from || "玩家"}</span>
    </div>
  {/if}
</div>
