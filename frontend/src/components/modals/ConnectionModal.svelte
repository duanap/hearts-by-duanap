<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    reconnect: void;
    reload: void;
    openroom: void;
  }>();

  $: open = state.modals.connection;
  $: title = state.connecting ? "正在重连" : state.connected ? "连接已恢复" : "连接已断开";
  $: subtitle = state.connecting
    ? "正在尝试重新连接服务端。若长时间无响应，可以刷新页面。"
    : state.connected
      ? "已与服务器重新建立连接。"
      : "已与服务器断开连接。可以先重连服务端；如果仍无响应，请刷新页面或重启 APP。";
</script>

<div class="modal" class:hidden={!open} id="connectionModal">
  <button type="button" class="modal-mask" id="connectionMask" aria-label="关闭连接弹窗" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card connection-card">
    <button class="modal-close" id="closeConnectionBtn" on:click={() => dispatch("close")}>×</button>
    <h2 class="modal-title" id="connectionTitle">{title}</h2>
    <div class="modal-subtitle" id="connectionSubtitle">{subtitle}</div>
    <div class="connection-server-line" id="connectionServerLine" class:hidden={!state.connection.error}>{state.connection.error}</div>
    <div class="modal-actions">
      <button class="action-btn" id="connectionReconnectBtn" on:click={() => dispatch("reconnect")}>{state.connecting ? "重连中" : "重连服务端"}</button>
      <button class="action-btn secondary" id="connectionReloadBtn" on:click={() => dispatch("reload")}>刷新页面</button>
      <button class="action-btn secondary" id="connectionOpenRoomBtn" on:click={() => dispatch("openroom")}>查看房间</button>
    </div>
  </div>
</div>
