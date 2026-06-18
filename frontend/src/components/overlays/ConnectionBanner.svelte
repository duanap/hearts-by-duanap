<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;

  const dispatch = createEventDispatcher<{ openconnection: void }>();

  $: text = state.connected
    ? ""
    : state.connecting
      ? (state.roomId ? "网络已断开，正在自动重连……" : "正在连接联机服务端……")
      : (state.offlineBanner || "网络已断开，可尝试重连。");
</script>

<button
  type="button"
  class="offline-banner"
  class:hidden={!text}
  id="offlineBanner"
  style="pointer-events:auto;cursor:pointer;font:inherit;"
  on:click={() => dispatch("openconnection")}
>
  {text}
</button>
