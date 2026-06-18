<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { rankText, SUITS } from "../../stores/gameStore";
  import type { Card } from "../../types/messages";
  import { orderedLastTrickCards } from "../../utils/gameState";
  import { formatTrickSummary } from "../../utils/format";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ close: void }>();

  $: last = state.lastTrick;
  $: orderedCards = orderedLastTrickCards(last);
  $: leadSuit = last?.leadSuit ? SUITS[last.leadSuit]?.name || "未知花色" : "未知花色";
  $: winnerName = last?.winnerPlayer == null ? "玩家" : state.players[last.winnerPlayer]?.name || "玩家";
  $: points = Number(last?.points || 0);

  function relationLabelForView(viewIndex: number): string {
    if (viewIndex === 0) return "本家 / 自己";
    if (viewIndex === 1) return "上家";
    if (viewIndex === 2) return "对家";
    if (viewIndex === 3) return "下家";
    return "玩家";
  }

  function cardColor(card: Card): string {
    return SUITS[card.suit]?.color === "red" ? "red" : "";
  }
</script>

<div class="modal" class:hidden={!state.lastTrickOpen} id="lastTrickModal">
  <button class="modal-mask" type="button" aria-label="关闭上一墩" on:click={() => dispatch("close")}></button>
  <div class="modal-card table-info-card last-trick-popover" id="lastTrickPopover" aria-hidden={!state.lastTrickOpen}>
    {#if last && orderedCards.length}
      <div class="last-trick-title">
        <div>
          <h2 class="modal-title">上一墩</h2>
          <div class="modal-subtitle last-trick-subtitle">第 {Number(last.trickNo || state.trickNo || 1)} 墩 · 首出 {leadSuit}</div>
        </div>
        <button class="modal-close last-trick-close" type="button" data-close-last-trick on:click={() => dispatch("close")}>×</button>
      </div>
      <div class="last-trick-stat-row">
        <span>收墩：{winnerName}</span>
        <span>{points} 分</span>
      </div>
      <div class="last-trick-grid">
        {#each orderedCards as play, index (`${play.player}:${play.card.id}`)}
          <div
            class="last-trick-cell"
            class:is-winner={play.player === last.winnerPlayer}
            class:is-leader={play.player === last.leaderPlayer}
            class:is-self={play.player === 0}
          >
            <div class="last-trick-order">{index + 1}</div>
            <div class="last-trick-name">{state.players[play.player]?.name || "玩家"}</div>
            <div class="last-trick-role">{relationLabelForView(play.player)}</div>
            <div class={`last-trick-card ${cardColor(play.card)}`}>{rankText(play.card.rank)}<br />{SUITS[play.card.suit]?.symbol}</div>
            <div class="last-trick-meta">{play.player === last.winnerPlayer ? "收墩" : "出牌"}</div>
            {#if play.player === last.leaderPlayer}
              <div class="last-trick-lead-badge">首出</div>
            {/if}
          </div>
        {/each}
      </div>
      <div class="last-trick-summary">{formatTrickSummary(winnerName, points)}</div>
    {:else}
      <div class="last-trick-title">
        <h2 class="modal-title">上一墩</h2>
        <button class="modal-close last-trick-close" type="button" data-close-last-trick on:click={() => dispatch("close")}>×</button>
      </div>
      <div class="last-trick-summary">暂无上一墩出牌记录。</div>
    {/if}
    <div class="modal-actions">
      <button class="action-btn secondary" type="button" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
