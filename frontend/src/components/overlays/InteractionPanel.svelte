<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { closeInteractionPanel, openQuickInteractionPanel } from "../../stores/gameStore";
  import type { InteractionItem } from "../../utils/interactions";
  import { INTERACTION_EMOJIS, TARGET_INTERACTION_TOOLS, interactionCooldownRemaining } from "../../utils/interactions";
  import type { InteractionType } from "../../types/messages";
  import { centerInteractionAnchor } from "../../utils/geometry";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    send: {
      kind: InteractionType;
      itemOverride?: InteractionItem;
      globalCooldown?: boolean;
      targetViewIndex: number;
    };
  }>();

  let now = Date.now();
  let ticker: number | null = null;

  $: panel = state.interactionPanel;
  $: isOpen = panel.open && Boolean(panel.mode);
  $: menuClass = [
    "interaction-target-menu",
    isOpen ? "" : "hidden",
    `menu-${panel.placement}`,
    panel.mode === "quick" ? "quick-emoji-menu" : ""
  ].filter(Boolean).join(" ");
  $: menuStyle = `left:${panel.x}px;top:${panel.y}px;--screen-rot:${state.layout?.screenRotation ?? (state.forceLandscape ? 90 : 0)}deg;`;

  function remaining(item: InteractionItem, globalCooldown = false): number {
    return interactionCooldownRemaining(state.interactionCooldowns, item.kind, panel.targetViewIndex, globalCooldown, now);
  }

  function optionLabel(item: InteractionItem, globalCooldown = false): string {
    if (item.kind === "tomato" && !state.settings.allowTomato) return "番茄已关";
    const seconds = remaining(item, globalCooldown);
    return seconds ? `${item.label} ${seconds}s` : item.label;
  }

  function disabled(item: InteractionItem, globalCooldown = false): boolean {
    return Boolean(remaining(item, globalCooldown) || (item.kind === "tomato" && !state.settings.allowTomato));
  }

  function sendItem(item: InteractionItem, globalCooldown = false): void {
    if (disabled(item, globalCooldown)) return;
    dispatch("send", {
      kind: item.kind,
      itemOverride: item,
      globalCooldown,
      targetViewIndex: globalCooldown ? 0 : panel.targetViewIndex
    });
  }

  function openQuick(event: MouseEvent): void {
    event.stopPropagation();
    openQuickInteractionPanel(centerInteractionAnchor(state.layout));
  }

  function handleWindowClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!isOpen || target?.closest("#interactionTargetMenu") || target?.closest("#interactionBtn") || target?.closest(".seat")) return;
    closeInteractionPanel();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && isOpen) closeInteractionPanel();
  }

  function refreshTicker(): void {
    if (ticker != null) window.clearInterval(ticker);
    ticker = null;
    if (!isOpen) return;
    ticker = window.setInterval(() => {
      now = Date.now();
    }, 500);
  }

  $: refreshTicker();

  $: if (isOpen && state.activeModal) {
    closeInteractionPanel();
  }

  onMount(() => {
    window.addEventListener("click", handleWindowClick);
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleWindowClick);
    window.removeEventListener("keydown", handleKeydown);
    if (ticker != null) window.clearInterval(ticker);
  });
</script>

<button
  class="interaction-fab"
  id="interactionBtn"
  type="button"
  aria-haspopup="menu"
  aria-expanded={isOpen && panel.mode === "quick"}
  on:click={openQuick}
>
  💬 互动
</button>

<div
  class={menuClass}
  id="interactionTargetMenu"
  role="menu"
  aria-hidden={!isOpen}
  style={menuStyle}
  on:click={(event) => event.stopPropagation()}
>
  {#if panel.mode === "quick"}
    {#each INTERACTION_EMOJIS as item, index}
      <button type="button" role="menuitem" data-quick-emoji-index={index} disabled={disabled(item, true)} on:click={() => sendItem(item, true)}>
        {item.icon} {optionLabel(item, true)}
      </button>
    {/each}
  {:else}
    {#each TARGET_INTERACTION_TOOLS as item}
      <button type="button" role="menuitem" data-target-menu-kind={item.kind} disabled={disabled(item)} on:click={() => sendItem(item)}>
        {item.icon} {optionLabel(item)}
      </button>
    {/each}
  {/if}
</div>
