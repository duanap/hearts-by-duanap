<script lang="ts">
  import type { LayoutState } from "../../services/layout";
  import { DEFAULT_LAYOUT_STATE } from "../../services/layout";

  export let count = 0;
  export let position: "west" | "north" | "east" = "north";
  export let layout: LayoutState = DEFAULT_LAYOUT_STATE;
  export let forceLandscape = false;

  $: activeLayout = layout.layoutKey ? layout : DEFAULT_LAYOUT_STATE;
  $: width = activeLayout.gameWidth || activeLayout.viewportWidth || 1024;
  $: height = activeLayout.gameHeight || activeLayout.viewportHeight || 768;
  $: portrait = !forceLandscape && activeLayout.isPortrait && width <= 620 && height > width;
  $: mobileLandscape = activeLayout.isMobile && (activeLayout.isRealLandscape || forceLandscape);
  $: forcedPortraitLandscape = forceLandscape && activeLayout.isPortrait;
  $: compactLandscape = activeLayout.isCompactLandscape || mobileLandscape;
  $: compactStack = activeLayout.isMobile && (activeLayout.isRealLandscape || forceLandscape || compactLandscape);
  $: small = width <= 900 || mobileLandscape;
  $: cardW = portrait ? 31 : forcedPortraitLandscape ? 28 : compactLandscape ? 28 : small ? 34 : 43;
  $: cardH = Math.round(cardW * 1.42);
  $: mid = (count - 1) / 2;
  $: stackCount = Math.min(3, Math.max(0, count));

  function cardStyle(index: number): string {
    if (position === "north") {
      const spread = portrait ? 13 : forcedPortraitLandscape ? 12 : compactLandscape ? 13 : small ? 17 : 20;
      const angle = (index - mid) * (portrait ? 3.2 : forcedPortraitLandscape ? 2.2 : compactLandscape ? 2.45 : 3.8);
      const curve = Math.abs(index - mid) * (portrait ? 1.1 : forcedPortraitLandscape ? 0.8 : compactLandscape ? 0.9 : 1.7);
      const top = portrait ? 60 + curve : forcedPortraitLandscape ? 14 + curve : compactLandscape ? 16 + curve : 74 + curve;
      return `width:${cardW}px;height:${cardH}px;left:calc(50% + ${(index - mid) * spread}px - ${cardW / 2}px);top:${top}px;--rot:${angle}deg;--deal-delay:${(index * 4 + 2) * 26}ms;--deal-x:0px;--deal-y:210px;transform:rotate(var(--rot));z-index:${index};`;
    }

    const step = portrait ? 9 : forcedPortraitLandscape ? 8 : compactLandscape ? 9 : small ? 12 : 15;
    const angle = position === "west"
      ? (portrait ? -72 + (index - mid) * 1.4 : forcedPortraitLandscape ? -64 + (index - mid) * 1.1 : compactLandscape ? -64 + (index - mid) * 1.35 : -63 + (index - mid) * 2.15)
      : (portrait ? 72 - (index - mid) * 1.4 : forcedPortraitLandscape ? 64 - (index - mid) * 1.1 : compactLandscape ? 64 - (index - mid) * 1.35 : 63 - (index - mid) * 2.15);
    const side = (portrait ? 27 : forcedPortraitLandscape ? 22 : compactLandscape ? 24 : 38) + Math.abs(index - mid) * 0.4;
    const dealX = position === "west" ? "190px" : "-190px";
    const sideRule = position === "west" ? `left:${side}px;` : `right:${side}px;`;
    return `width:${cardW}px;height:${cardH}px;${sideRule}top:${(portrait ? 10 : forcedPortraitLandscape ? 7 : compactLandscape ? 8 : 18) + index * step}px;--rot:${angle}deg;--deal-delay:${(index * 4 + (position === "west" ? 1 : 3)) * 26}ms;--deal-x:${dealX};--deal-y:20px;transform:rotate(var(--rot));z-index:${index};`;
  }

  function stackCardStyle(index: number): string {
    const stackW = forcedPortraitLandscape ? 32 : 36;
    const stackH = Math.round(stackW * 1.42);
    const dx = position === "east" ? -index * 6 : index * 6;
    const dy = index * 5;
    const rot = position === "north" ? -5 + index * 4 : position === "west" ? -7 + index * 3 : 7 - index * 3;
    return `width:${stackW}px;height:${stackH}px;left:${12 + dx}px;top:${3 + dy}px;--rot:${rot}deg;transform:rotate(var(--rot));z-index:${index};`;
  }
</script>

<div
  class={`opponent-hand ${position}`}
  class:compact-stack={compactStack}
  id={`opHand${position === "west" ? 1 : position === "north" ? 2 : 3}`}
>
  {#if compactStack}
    {#each Array(stackCount) as _, index}
      <div class="card-back stack-card" style={stackCardStyle(index)}></div>
    {/each}
  {:else}
    {#each Array(count) as _, index}
      <div class="card-back" style={cardStyle(index)}></div>
    {/each}
  {/if}
</div>
