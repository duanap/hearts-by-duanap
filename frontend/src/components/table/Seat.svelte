<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { LayoutState } from "../../services/layout";
  import type { ViewPlayer } from "../../stores/gameStore";
  import { formatPlayerStatus } from "../../utils/format";
  import { interactionAnchorFromElement } from "../../utils/geometry";

  export let player: ViewPlayer;
  export let viewIndex = 0;
  export let isTurn = false;
  export let isWinner = false;
  export let hostId = "";
  export let layout: LayoutState;

  const dispatch = createEventDispatcher<{
    interaction: { viewIndex: number; anchor: { x: number; y: number; placement: "above" | "below" | "left" | "right" | "center" } };
  }>();

  const positions = ["south", "west", "north", "east"];

  $: position = positions[viewIndex] || "south";
  $: kingdomAvatar = ["魏", "蜀", "吴"].includes(player.avatar);
  $: factionClass = kingdomAvatar ? (player.avatar === "魏" ? "bot-wei" : player.avatar === "蜀" ? "bot-shu" : "bot-wu") : "";
  $: aiControlled = Boolean(player.aiControlled);
  $: isHost = Boolean(hostId && player.id === hostId);
  $: disconnected = Boolean(player.id && !player.isBot && !player.connected);
  $: avatarVisualClass = ((player.isBot && !aiControlled) || (player.name === "等待中" && kingdomAvatar)) ? "bot-avatar" : "human-avatar";
  $: botText = player.isBot ? (aiControlled ? " - AI托管中" : " · AI") : "";
  $: offlineText = player.id && ((aiControlled || disconnected) && player.name !== "等待中") ? " · 离线" : "";
  $: statusTitle = formatPlayerStatus(player, isHost);

  function openInteraction(event: MouseEvent | KeyboardEvent): void {
    const node = event.currentTarget as HTMLElement | null;
    event.stopPropagation();
    dispatch("interaction", {
      viewIndex,
      anchor: interactionAnchorFromElement(viewIndex, node, layout)
    });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openInteraction(event);
  }
</script>

<section
  class="seat {position}"
  class:is-turn={isTurn}
  class:active={isTurn}
  class:current={isTurn}
  class:winner={isWinner}
  class:host={isHost}
  class:ai={player.isBot}
  class:offline={Boolean(offlineText)}
  class:disconnected={disconnected}
  class:controlled-by-ai={aiControlled}
  class:interactive={Boolean(player.id && viewIndex !== 0)}
  id={`seat${viewIndex}`}
  title={statusTitle}
  role="button"
  tabindex="0"
  on:click={openInteraction}
  on:keydown={handleKeydown}
>
  {#if isTurn}
    <div class="turn-indicator"><span class="turn-dot"></span><span>出牌中</span></div>
  {/if}
  <div class={`avatar ${player.avatarClass} ${avatarVisualClass} ${factionClass}`}>
    {#if isTurn}
      <span class="avatar-wave wave-one"></span><span class="avatar-wave wave-two"></span>
    {/if}
    <span class="avatar-symbol">{player.avatar}</span>
  </div>
  <div class="seat-name">
    {player.name}
    {#if isHost}
      <span class="seat-state host"> · 房主</span>
    {/if}
    {#if offlineText}
      <span class="seat-state offline">{offlineText}</span>
    {/if}
    {#if botText}
      <span class={`seat-state bot ${aiControlled ? "managed" : factionClass}`}>{botText}</span>
    {/if}
  </div>
  <div class="score-box">
    <div class="score-item"><span class="score-label">当前</span><span class="score-value">{player.round || 0}</span></div>
    <div class="score-divider"></div>
    <div class="score-item"><span class="score-label">总分</span><span class="score-value">{player.total || 0}</span></div>
  </div>
</section>
