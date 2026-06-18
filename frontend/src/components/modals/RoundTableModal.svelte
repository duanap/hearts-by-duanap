<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { cardName, rankText, SUITS } from "../../stores/gameStore";
  import type { Card } from "../../types/messages";
  import { getRoundTableRows } from "../../utils/gameState";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ close: void }>();

  $: open = state.modals.roundTable;
  $: table = state.roundTable;
  $: rows = getRoundTableRows(table);
  $: hasTricks = Boolean(table?.tricks?.length);

  function miniCardClass(card: Card, receivedIds?: Set<string>): string {
    const red = SUITS[card.suit]?.color === "red" ? "red" : "";
    const received = receivedIds?.has(card.id) ? "received" : "";
    return `round-mini-card ${red} ${received}`.trim();
  }

  function passText(row: { passedTo?: string }): string {
    return row.passedTo ? `给 ${row.passedTo}` : "本局不传牌";
  }

  function closeOnKey(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") dispatch("close");
  }
</script>

<div class="modal" class:hidden={!open} id="roundTableModal">
  <div class="modal-mask" id="roundTableMask" role="button" tabindex="0" on:click={() => dispatch("close")} on:keydown={closeOnKey}></div>
  <div class="modal-card table-info-card round-table-card">
    <div class="round-table-header">
      <div class="round-table-header-main">
        <h2 class="modal-title" id="roundTableTitle">第 {table?.roundNo || state.roundNo} 局牌桌</h2>
        <div class="modal-subtitle" id="roundTableSubtitle">
          {hasTricks ? "查看本局每一墩出牌记录。" : "金色描边为换入牌，横向滚动可查看完整牌堆。"}
        </div>
      </div>
      <button class="modal-close" id="closeRoundTableBtn" on:click={() => dispatch("close")}>×</button>
    </div>
    <div class="round-table-body">
      <div class="round-table-wrap">
        <table class="round-table-view" id="roundTableView">
          {#if hasTricks}
            <thead>
              <tr>
                <th>墩</th>
                <th>出牌</th>
                <th>赢家</th>
                <th>分数</th>
              </tr>
            </thead>
            <tbody>
              {#each table?.tricks || [] as trick}
                <tr class="round-table-row">
                  <td>第 {trick.trickNo} 墩</td>
                  <td>
                    <div class="round-card-strip">
                      {#each trick.cards as play (`${trick.trickNo}:${play.player}:${play.card.id}`)}
                        <span class={miniCardClass(play.card)} title={`${state.players[play.player]?.name || "玩家"}：${cardName(play.card)}`}>
                          {rankText(play.card.rank)}<br />{SUITS[play.card.suit]?.symbol}
                        </span>
                      {/each}
                    </div>
                  </td>
                  <td>{state.players[trick.winnerPlayer]?.name || "玩家"}</td>
                  <td>{Number(trick.points || 0)}</td>
                </tr>
              {/each}
            </tbody>
          {:else if rows.length}
            <caption class="round-table-toolbar">
              <span>{table?.passName || "传牌"}</span>
              <span>{rows.length} 位玩家</span>
            </caption>
            <tbody>
              {#each rows as row, index (`${row.name}:${index}`)}
                <tr class="round-table-row">
                  <td class="round-player-cell">
                    <div class="round-player-avatar">{row.avatar || "?"}</div>
                    <div>
                      <div class="round-player-name">{row.name || "玩家"}</div>
                      <div class="round-player-meta">本局 {Number(row.round || 0)} 分 · 总分 {Number(row.total || 0)}</div>
                    </div>
                  </td>
                  <td>
                    <div class="round-cell-title">牌堆</div>
                    <div class="round-card-strip">
                      {#if row.cards?.length}
                        {#each row.cards as card (card.id)}
                          <span class={miniCardClass(card, row.receivedIdSet)} title={cardName(card)}>{rankText(card.rank)}<br />{SUITS[card.suit]?.symbol}</span>
                        {/each}
                      {:else}
                        <span class="round-pass-muted">暂无记录</span>
                      {/if}
                    </div>
                  </td>
                  <td>
                    <div class="round-pass-info"><span class="round-pass-pill">{passText(row)}</span></div>
                    <div class="round-card-strip pass-cards">
                      {#if row.passedCards?.length}
                        {#each row.passedCards as card (card.id)}
                          <span class={miniCardClass(card)} title={cardName(card)}>{rankText(card.rank)}<br />{SUITS[card.suit]?.symbol}</span>
                        {/each}
                      {:else}
                        <span class="round-pass-muted">没有给出牌</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          {:else}
            <tbody>
              <tr class="round-table-row">
                <td><span class="round-pass-muted">当前还没有可查看的牌桌记录。</span></td>
              </tr>
            </tbody>
          {/if}
        </table>
      </div>
    </div>
    <div class="modal-actions round-table-actions">
      <button class="action-btn secondary" id="closeRoundTableBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
