<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import CardView from "./Card.svelte";
  import type { Card } from "../../types/messages";
  import type { LayoutState } from "../../services/layout";
  import { DEFAULT_LAYOUT_STATE } from "../../services/layout";
  import { getPassMotionVector, sortHand } from "../../utils/cards";

  export let hand: Card[] = [];
  export let phase = "offline";
  export let currentPlayer = 0;
  export let busy = false;
  export let selectedPass = new Set<string>();
  export let selectedCardIds = new Set<string>();
  export let legalCardIds = new Set<string>();
  export let passingCardIds = new Set<string>();
  export let receivedHighlightIds = new Set<string>();
  export let passMode = 0;
  export let passSending = false;
  export let youPassed = false;
  export let playSending = false;
  export let layout: LayoutState = DEFAULT_LAYOUT_STATE;
  export let forceLandscape = false;

  const dispatch = createEventDispatcher<{ cardclick: string }>();
  const EMPTY_CARD_SET = new Set<string>();

  $: optimisticPlayedIds = phase === "play" && playSending ? selectedCardIds : EMPTY_CARD_SET;
  $: sortedHand = sortHand(hand).filter(card => !optimisticPlayedIds.has(card.id));
  $: canPlay = phase === "play" && currentPlayer === 0 && !busy && !playSending;
  $: canPass = phase === "pass" && !youPassed && !passSending;
  $: handDisabled = phase === "pass" ? passSending || youPassed : phase === "play" ? playSending : true;
  $: count = sortedHand.length;
  $: activeLayout = layout.layoutKey ? layout : DEFAULT_LAYOUT_STATE;
  $: width = activeLayout.gameWidth || activeLayout.viewportWidth || 1024;
  $: height = activeLayout.gameHeight || activeLayout.viewportHeight || 768;
  $: portrait = !forceLandscape && activeLayout.isPortrait && width <= 620 && height > width;
  $: mobileLandscape = activeLayout.isMobile && (activeLayout.isRealLandscape || forceLandscape);
  $: forcedPortraitLandscape = forceLandscape && activeLayout.isPortrait;
  $: compactLandscape = activeLayout.isCompactLandscape || mobileLandscape;
  $: small = width <= 900 || mobileLandscape;
  $: cardW = portrait ? 38 : forcedPortraitLandscape ? 40 : compactLandscape ? 42 : small ? 52 : 64;
  $: cardH = Math.round(cardW * 1.43);
  $: spreadLimit = portrait ? 29 : forcedPortraitLandscape ? 30 : compactLandscape ? 32 : small ? 38 : 42;
  $: minSpread = portrait ? 18 : compactLandscape ? 20 : 24;
  $: handMaxWidth = forcedPortraitLandscape
    ? Math.min(width * 0.62, 640)
    : mobileLandscape
      ? Math.min(width * 0.64, 680)
      : Math.min(width * 0.64, 700);
  $: spread = Math.max(minSpread, Math.min(spreadLimit, (handMaxWidth - cardW) / Math.max(1, count - 1)));
  $: mid = (count - 1) / 2;
  $: baseY = portrait ? 26 : forcedPortraitLandscape ? 24 : compactLandscape ? 28 : small ? 50 : 70;

  function cardStyle(index: number, interactive: boolean): string {
    const angle = (index - mid) * (portrait ? 1.8 : forcedPortraitLandscape ? 2.2 : compactLandscape ? 2.5 : small ? 4.1 : 3.8);
    const x = `calc(50% + ${(index - mid) * spread}px - ${cardW / 2}px)`;
    const y = baseY + Math.abs(index - mid) * (portrait ? 1.2 : forcedPortraitLandscape ? 1.3 : compactLandscape ? 1.5 : small ? 2.3 : 3.2);
    const out = getPassMotionVector(passMode, "out");
    const inside = getPassMotionVector(passMode, "in");
    const cursor = interactive ? "pointer" : "default";
    return `width:${cardW}px;height:${cardH}px;left:${x};top:${y}px;--rot:${angle}deg;--deal-delay:${index * 4 * 26}ms;--deal-x:0px;--deal-y:-230px;--pass-x:${out.x};--pass-y:${out.y};--receive-x:${inside.x};--receive-y:${inside.y};z-index:${20 + index};cursor:${cursor};`;
  }
</script>

<section class="player-hand" id="hand">
  {#each sortedHand as card, index (card.id)}
    <CardView
      {card}
      selected={selectedCardIds.has(card.id) || selectedPass.has(card.id)}
      legal={canPlay && legalCardIds.has(card.id)}
      illegal={canPlay && !legalCardIds.has(card.id)}
      justReceived={receivedHighlightIds.has(card.id)}
      passingOut={passingCardIds.has(card.id)}
      disabled={handDisabled}
      style={cardStyle(index, canPlay || canPass)}
      on:cardclick={(event) => dispatch("cardclick", event.detail)}
    />
  {/each}
</section>
