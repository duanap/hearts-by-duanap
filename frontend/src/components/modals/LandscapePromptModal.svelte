<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    enable: void;
  }>();

  $: open = state.modals.landscapePrompt;
</script>

<div class="modal" class:hidden={!open} id="landscapePromptModal">
  <button
    type="button"
    class="modal-mask"
    id="landscapePromptMask"
    aria-label="关闭横屏提示"
    style="border:0;padding:0;"
    on:click={() => dispatch("close")}
  ></button>
  <div class="modal-card">
    <button class="modal-close" id="closeLandscapePromptBtn" type="button" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title">建议开启横屏</h2>
    <div class="modal-subtitle">检测到当前窗口接近手机竖屏尺寸，横屏可以减少遮挡，让手牌和牌桌更清楚。</div>
    <div class="landscape-tip">
      <span><strong>推荐：</strong>点击“开启横屏”，只切换横屏显示，不会自动进入全屏。</span>
      <span>“横屏”和“全屏”彼此独立，可以单独启用，也可以同时启用。</span>
    </div>
    <div class="modal-actions">
      <button class="action-btn" id="enableLandscapePromptBtn" type="button" on:click={() => dispatch("enable")}>开启横屏</button>
      <button class="action-btn secondary" id="skipLandscapePromptBtn" type="button" on:click={() => dispatch("close")}>稍后再说</button>
    </div>
  </div>
</div>
