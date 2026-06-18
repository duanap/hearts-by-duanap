<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import type { InteractionMenuAnchor } from "../../types/messages";
  import Seat from "./Seat.svelte";
  import OpponentHand from "./OpponentHand.svelte";
  import PlayerHand from "./PlayerHand.svelte";
  import TrickArea from "./TrickArea.svelte";
  import CenterRing from "./CenterRing.svelte";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    openroom: void;
    opensettings: void;
    openconnection: void;
    centeraction: void;
    restartgame: void;
    openlasttrick: void;
    openroundtable: void;
    openinteraction: { viewIndex: number; anchor: InteractionMenuAnchor };
    cardclick: string;
    togglelandscape: void;
    togglefullscreen: void;
  }>();

  $: canViewTable = Boolean(state.roundTable && ["roundEnd", "gameEnd"].includes(state.phase));
  $: canViewLast = Boolean(state.lastTrick && state.lastTrick.cards?.length && state.phase === "play" && !state.busy && !state.comparingTrick && !state.collectingTrick);

  function openRoundTable(event: PointerEvent | MouseEvent): void {
    event.stopPropagation();
    dispatch("openroundtable");
  }

  function openLastTrick(event: PointerEvent | MouseEvent): void {
    event.stopPropagation();
    dispatch("openlasttrick");
  }
</script>

<main class="table-scene" class:dealing={state.phase === "deal"}>
  <div class="brand">
    <span class="brand-main">Hearts by duanap</span><span class="brand-version">Svelte</span>
  </div>

  <div class="top-actions">
    <button class="top-btn" id="landscapeBtn" on:click={() => dispatch("togglelandscape")}>{state.forceLandscape ? "退出横屏" : "横屏"}</button>
    <button class="top-btn" id="fullscreenBtn" on:click={() => dispatch("togglefullscreen")}>{state.fullscreenActive ? "退出全屏" : "全屏"}</button>
    {#if !state.connected}
    <button class="top-btn" id="openConnectionBtn" on:click={() => dispatch("openconnection")}>{state.connecting ? "连接中" : "断线"}</button>
    {/if}
    <button class="top-btn" id="openRoomBtn" on:click={() => dispatch("openroom")}>{state.roomId ? `房间 ${state.roomId}` : "房间"}</button>
    <button class="top-btn" id="openSettingsBtn" on:click={() => dispatch("opensettings")}>设置</button>
  </div>

  {#each state.players as player, viewIndex}
    <Seat
      {player}
      {viewIndex}
      hostId={state.hostId}
      layout={state.layout}
      isTurn={state.phase === "play" && state.currentPlayer === viewIndex && !state.comparingTrick && !state.collectingTrick}
      isWinner={(state.comparingTrick || state.collectingTrick) && state.trickWinnerPlayer === viewIndex}
      on:interaction={(event) => dispatch("openinteraction", event.detail)}
    />
  {/each}

  <OpponentHand position="north" count={state.players[2]?.handCount || 0} layout={state.layout} forceLandscape={state.forceLandscape} />
  <OpponentHand position="west" count={state.players[1]?.handCount || 0} layout={state.layout} forceLandscape={state.forceLandscape} />
  <OpponentHand position="east" count={state.players[3]?.handCount || 0} layout={state.layout} forceLandscape={state.forceLandscape} />

  <CenterRing
    {state}
    on:centeraction={() => dispatch("centeraction")}
    on:restartgame={() => dispatch("restartgame")}
  />

  <button class="table-action-btn center-table-btn" class:hidden={!canViewTable} id="viewRoundTableBtn" type="button" aria-label="查看牌桌" on:pointerdown={openRoundTable} on:click={openRoundTable}>
    <span class="table-action-icon" aria-hidden="true">▣</span><span>牌桌</span>
  </button>
  <button class="table-action-btn last-trick-btn" class:hidden={!canViewLast} id="lastTrickBtn" type="button" aria-label="查看上一轮" on:pointerdown={openLastTrick} on:click={openLastTrick}>
    <span class="table-action-icon" aria-hidden="true">↩</span><span>上一轮</span>
  </button>

  <TrickArea
    trick={state.trick}
    comparingTrick={state.comparingTrick}
    collectingTrick={state.collectingTrick}
    trickWinnerPlayer={state.trickWinnerPlayer}
    judgeText={state.judgeText}
    players={state.players}
    lastTrickWinner={state.lastTrick?.winnerPlayer ?? null}
  />

  <div class={`hand-tip ${state.handTipType ? `tip-${state.handTipType}` : ""}`} class:hidden={!state.handTip} id="handTip">{state.handTip}</div>
  <PlayerHand
    hand={state.players[0]?.hand || []}
    phase={state.phase}
    currentPlayer={state.currentPlayer}
    busy={state.busy || state.comparingTrick || state.collectingTrick}
    selectedPass={state.selectedPass}
    selectedCardIds={state.selectedCardIds}
    legalCardIds={state.legalCardIds}
    passingCardIds={state.passingCardIds}
    receivedHighlightIds={state.receivedHighlightIds}
    passMode={state.passMode}
    passSending={state.passSending}
    youPassed={state.youPassed}
    playSending={state.playSending}
    layout={state.layout}
    forceLandscape={state.forceLandscape}
    on:cardclick={(event) => dispatch("cardclick", event.detail)}
  />
</main>
