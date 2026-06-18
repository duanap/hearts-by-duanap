<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { cardName } from "../../stores/gameStore";
  import type { InteractionItem } from "../../utils/interactions";
  import type { InteractionType } from "../../types/messages";
  import AnimationLayer from "./AnimationLayer.svelte";
  import InteractionLayer from "./InteractionLayer.svelte";
  import InteractionPanel from "./InteractionPanel.svelte";
  import SpecialEventLayer from "./SpecialEventLayer.svelte";

  export let state: GameState;
  const dispatch = createEventDispatcher<{
    interaction: {
      kind: InteractionType;
      itemOverride?: InteractionItem;
      globalCooldown?: boolean;
      targetViewIndex: number;
    };
  }>();

  let lastTurnReminderKey = "";
  let turnReminderVisible = false;
  let turnReminderTimer: number | null = null;

  $: receiveText = state.receivedCards.length
    ? state.receivedCards.map(cardName).join("、")
    : "";
  $: showReceiveToast = Boolean(receiveText && state.receivedHighlightIds.size);
  $: showYourTurn = state.phase === "play" && state.currentPlayer === 0 && !state.busy && !state.comparingTrick && !state.collectingTrick;
  $: turnReminderKey = showYourTurn ? `${state.roomId}:${state.roundNo}:${state.trickNo}:${state.trick.length}:${state.legalCardIds.size}` : "";

  $: if (turnReminderKey && turnReminderKey !== lastTurnReminderKey) {
    lastTurnReminderKey = turnReminderKey;
    turnReminderVisible = true;
    if (turnReminderTimer != null) window.clearTimeout(turnReminderTimer);
    turnReminderTimer = window.setTimeout(() => {
      turnReminderVisible = false;
      turnReminderTimer = null;
    }, 1900);
  } else if (!showYourTurn) {
    turnReminderVisible = false;
  }

  onDestroy(() => {
    if (turnReminderTimer != null) window.clearTimeout(turnReminderTimer);
  });
</script>

<div class="receive-toast" class:hidden={!showReceiveToast} id="receiveToast">
  {#if receiveText}
    你从{state.receivedFrom || "其他玩家"}收到：<strong>{receiveText}</strong>
  {/if}
</div>
<AnimationLayer {state} />
<InteractionLayer {state} />
<InteractionPanel {state} on:send={(event) => dispatch("interaction", event.detail)} />
<div class="your-turn-reminder" class:hidden={!turnReminderVisible} id="yourTurnReminder" aria-hidden="true">轮到你出牌</div>
<SpecialEventLayer {state} />
