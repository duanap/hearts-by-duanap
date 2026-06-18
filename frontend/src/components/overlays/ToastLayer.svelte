<script lang="ts">
  import type { GameState } from "../../stores/gameStore";

  export let state: GameState;
</script>

<div class={`action-toast toast-${state.toastType}`} class:hidden={!state.toast} id="actionToast">{state.toast}</div>
