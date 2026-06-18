<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { canRestartGame, canStartNextRound, getRanking } from "../../utils/gameState";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    next: void;
    restart: void;
    roundtable: void;
  }>();

  $: open = state.modals.result;
  $: isGameEnd = state.phase === "gameEnd";
  $: ranking = getRanking(state.players);
  $: winners = ranking.filter(item => item.isWinner);
  $: winnerNames = winners.map(item => item.player.name).filter(Boolean).join("、");
  $: title = isGameEnd
    ? `恭喜 ${winnerNames || "获胜"} 玩家获得胜利！`
    : "本局结算";
  $: subtitle = isGameEnd
    ? "游戏结束，低分玩家获胜。"
    : "本局战绩已结算，可以继续下一局。";
  $: moonShooterName = state.moonShooter == null ? "" : state.players[state.moonShooter]?.name || "";
  $: canNext = !isGameEnd && canStartNextRound(state);
  $: canRestart = isGameEnd && canRestartGame(state);

  function closeOnKey(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") dispatch("close");
  }
</script>

<div class="modal" class:hidden={!open} id="resultModal">
  <div class="modal-mask" id="resultMask" role="button" tabindex="0" on:click={() => dispatch("close")} on:keydown={closeOnKey}></div>
  <div class="modal-card result-card">
    <div class="result-header">
      <div class="result-header-main">
        <h2 class="modal-title" id="resultTitle">{title}</h2>
        <div class="modal-subtitle" id="resultSubtitle">
          {subtitle}
          {#if moonShooterName}
            <br />{moonShooterName} 本局射月。
          {/if}
        </div>
      </div>
      <button class="modal-close" id="closeResultBtn" on:click={() => dispatch("close")}>×</button>
    </div>
    <div class="result-scroll-body">
      <div class="result-score-board" id="resultScoreTable">
        {#each ranking as item (`${item.player.id || item.index}:${item.rank}`)}
          <div class="result-player-card" class:is-winner={item.isWinner}>
            <div class="result-rank-medal">{item.rank === 1 ? "🏆" : item.rank}</div>
            <div class="result-player-main">
              <div class="result-player-name">{item.player.name}</div>
              <div class="result-player-sub">
                {item.player.avatar || ""}
                {#if item.player.isBot}
                  <span>AI 玩家</span>
                {/if}
              </div>
            </div>
            <div class="result-score-pill"><span>本局</span><strong>{item.round}</strong></div>
            <div class="result-score-pill total"><span>总分</span><strong>{item.total}</strong></div>
            <div class="result-badge-wrap">
              {#if item.isWinner}
                <span class="result-badge">{isGameEnd ? "胜利" : "领先"}</span>
              {:else}
                <span class="result-keep-going">继续加油</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
    <div class="modal-actions result-actions">
      {#if !isGameEnd}
        <button class="action-btn" id="startNextRoundBtn" disabled={!canNext} on:click={() => dispatch("next")}>下一局</button>
      {/if}
      {#if isGameEnd}
        <button class="action-btn" id="playAgainBtn" disabled={!canRestart} on:click={() => dispatch("restart")}>重新开始</button>
      {/if}
      <button class="action-btn secondary" id="viewTableBtn" disabled={!state.roundTable} on:click={() => dispatch("roundtable")}>查看牌桌</button>
      <button class="action-btn secondary" id="closeResultBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
