<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ close: void }>();

  const versionLogs = [
    {
      version: "v1.4.22 / Svelte 迁移",
      items: [
        "前端逐步迁移到 Svelte + Vite + TypeScript，保留旧桌面风格和 WebSocket 协议。",
        "本阶段补齐设置、日志、规则、音效开关和特殊事件基础展示。",
        "构建产物仍输出到 frontend/dist/，不覆盖线上 public/。"
      ]
    },
    {
      version: "v1.4.14 - v1.4.22",
      items: [
        "优化上一轮、牌桌回看、结算展示和移动端横屏体验。",
        "统一房间、设置、日志、牌桌按钮的深绿色金色风格。",
        "保留 PWA、Service Worker 和缓存刷新入口，后续替换 public/ 前统一处理缓存名。"
      ]
    },
    {
      version: "v1.4.0 - v1.4.13",
      items: [
        "加入牌桌互动、高光播报、上一轮回看、射月提示和 AI 接管提示。",
        "增强 AI 出牌、传牌和防射月策略。",
        "多次修正横屏、移动端和浮动按钮层级。"
      ]
    }
  ];

  $: open = state.modals.versionLog;
</script>

<div class="modal" class:hidden={!open} id="versionLogModal">
  <button type="button" class="modal-mask" id="versionLogMask" aria-label="关闭版本日志" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card">
    <button class="modal-close" id="closeVersionLogBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title">版本更新日志</h2>
    <div class="modal-subtitle">保留旧版设置入口中的版本信息，当前展示 Svelte 迁移重点。</div>
    <div class="version-log-list" id="versionLogList">
      {#each versionLogs as item}
        <div class="version-log-item">
          <h3>{item.version}</h3>
          <ul>
            {#each item.items as line}
              <li>{line}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <div class="modal-actions">
      <button class="action-btn secondary" id="closeVersionLogBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
