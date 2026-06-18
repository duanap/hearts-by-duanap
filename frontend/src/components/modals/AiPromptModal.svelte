<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: "fill" | "takeover";
  }>();

  $: open = state.modals.aiPrompt && Boolean(state.aiPromptAction);
  $: busy = state.aiBusy === state.aiPromptAction;

  function confirm() {
    if (state.aiPromptAction === "fill" || state.aiPromptAction === "takeover") {
      dispatch("confirm", state.aiPromptAction);
    }
  }
</script>

<div class="modal" class:hidden={!open} id="aiPromptModal">
  <button type="button" class="modal-mask" id="aiPromptMask" aria-label="关闭 AI 接管提示" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card">
    <button class="modal-close" id="closeAiPromptBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title" id="aiPromptTitle">{state.aiPromptTitle || "AI 接管提示"}</h2>
    <div class="modal-subtitle" id="aiPromptSubtitle">{state.aiPromptSubtitle || "有玩家离线或退出，房主可选择让 AI 接管，避免牌局卡住。"}</div>
    <div class="modal-actions">
      <button class="action-btn" id="aiPromptConfirmBtn" disabled={busy || !state.connected} on:click={confirm}>{busy ? "发送中" : state.aiPromptButton || "确认"}</button>
      <button class="action-btn secondary" id="aiPromptLaterBtn" on:click={() => dispatch("close")}>稍后处理</button>
    </div>
  </div>
</div>
