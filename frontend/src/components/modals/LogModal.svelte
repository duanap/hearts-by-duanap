<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { classifyLogText, logTypeClass, simplifyLogText, visiblePlayLogs } from "../../utils/format";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ close: void }>();

  $: open = state.modals.log;
  $: logs = visiblePlayLogs(state.logs || state.log || []);
  $: summary = logs.length ? `仅显示传牌、出牌和收墩等关键记录，共 ${logs.length} 条。` : "暂无出牌记录。";
</script>

<div class="modal" class:hidden={!open} id="logModal">
  <button type="button" class="modal-mask" id="logMask" aria-label="关闭日志弹窗" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card table-info-card log-card">
    <button class="modal-close" id="closeLogBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title">出牌日志</h2>
    <div class="modal-subtitle" id="logSummary">{summary}</div>
    <div class="log-list" id="logList">
      <table class="log-table">
        <thead>
          <tr><th>局数</th><th>类型</th><th>内容</th></tr>
        </thead>
        <tbody>
          {#if logs.length}
            {#each logs as item, index (`${item.round}:${index}:${item.text}`)}
              {@const type = classifyLogText(item.text)}
              <tr>
                <td class="log-round">第 {item.round || state.roundNo} 局</td>
                <td><span class={`log-type ${logTypeClass(type)}`}>{type}</span></td>
                <td class="log-detail">{simplifyLogText(item.text)}</td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td class="log-round">暂无</td>
              <td><span class="log-type">记录</span></td>
              <td class="log-detail">还没有出牌记录。</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <div class="modal-actions">
      <button class="action-btn secondary" id="closeLogBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
