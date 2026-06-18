<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import {
    cancelRunningAnimations,
    clearAnimationLayer,
    nextAnimationFrame,
    playCollectAnimation,
    playLocalPassAnimation,
    playPassFlowAnimation,
    type PassFlowAnimationItem
  } from "../../services/animationService";
  import type { TrickPlay } from "../../types/messages";
  import { absToViewIndex } from "../../utils/gameState";

  export let state: GameState;

  const LAYOUT_SETTLE_MS = 190;

  let lastLayoutKey = "";
  let layoutReadyAt = 0;
  let recoveryTimer: number | null = null;

  let localPassActiveKey = "";
  let passFlowActiveKey = "";
  let collectActiveKey = "";

  let localPassPlayedKey = "";
  let passFlowPlayedKey = "";
  let collectPlayedKey = "";
  let localPassRoundKey = "";

  let interruptedLocalPassKey = "";
  let interruptedPassFlowKey = "";
  let interruptedCollectKey = "";

  let localPassRunId = 0;
  let passFlowRunId = 0;
  let collectRunId = 0;

  $: localPassKey = currentLocalPassKey();
  $: passFlowKey = currentPassFlowKey();
  $: collectKey = currentCollectKey();

  $: if (state.layout.layoutKey && state.layout.layoutKey !== lastLayoutKey) {
    lastLayoutKey = state.layout.layoutKey;
    layoutReadyAt = Date.now() + LAYOUT_SETTLE_MS;
    interruptTransientAnimations();
  }

  $: if (localPassKey) {
    void startLocalPassAnimation();
  } else if (!state.passSending) {
    interruptedLocalPassKey = "";
    localPassActiveKey = "";
  }

  $: if (passFlowKey) {
    void startPassFlowAnimation();
  }

  $: if (collectKey) {
    void startCollectAnimation();
  } else if (!state.collectingTrick) {
    interruptedCollectKey = "";
    collectActiveKey = "";
    collectPlayedKey = "";
  }

  function runtime() {
    return {
      settings: state.settings,
      forceLandscape: state.forceLandscape,
      layout: state.layout
    };
  }

  function currentLocalPassKey(): string {
    const ids = Array.from(state.passingCardIds || []).sort().join("|");
    return state.passSending && ids
      ? `${state.roomId}:${state.roundNo}:${state.passMode}:${ids}`
      : "";
  }

  function localPassCardIds(): string[] {
    return Array.from(state.passingCardIds || []).sort();
  }

  function currentPassFlowKey(): string {
    const flow = state.passFlow;
    if (!flow || state.phase !== "play" || !flow.seq) return "";
    return `${state.roomId}:${flow.seq || 0}:${flow.roundNo || state.roundNo}:${flow.passMode ?? state.passMode}`;
  }

  function currentCollectKey(): string {
    const trick = collectTrickPlays();
    const winner = collectWinnerView();
    if (!state.collectingTrick || trick.length !== 4 || winner == null) return "";
    return `${state.roomId}:${state.roundNo}:${collectTrickNumber()}:${winner}:${trick.map(item => `${item.player}-${item.card?.id || ""}`).join("|")}`;
  }

  function collectTrickPlays(): TrickPlay[] {
    return state.collectingTrick && state.trick.length === 4 ? state.trick : [];
  }

  function collectWinnerView(): number | null {
    return state.collectingTrick && state.trickWinnerPlayer != null ? state.trickWinnerPlayer : null;
  }

  function collectTrickNumber(): number {
    return Number(state.trickNo || 0) + 1;
  }

  function passFlowItems(): PassFlowAnimationItem[] {
    const flow = state.passFlow;
    if (!flow) return [];
    const roundKey = `${state.roomId}:${flow.roundNo || state.roundNo}:${flow.passMode ?? state.passMode}`;
    const suppressLocal = roundKey === localPassRoundKey;
    return (flow.flows || [])
      .map(item => ({
        fromView: absToViewIndex(item.from, state.yourIndex),
        toView: absToViewIndex(item.to, state.yourIndex),
        count: item.count
      }))
      .filter(item => !suppressLocal || (item.fromView !== 0 && item.toView !== 0));
  }

  async function waitForLayoutStable(): Promise<void> {
    const remaining = Math.max(0, layoutReadyAt - Date.now());
    if (remaining > 0) {
      await new Promise<void>(resolve => window.setTimeout(resolve, remaining));
    }
    await tick();
    await nextAnimationFrame();
    await nextAnimationFrame();
  }

  async function waitForNextPaint(): Promise<void> {
    await tick();
    await nextAnimationFrame();
  }

  async function runAfterStableLayout(task: () => Promise<void>, settle = true): Promise<void> {
    try {
      if (settle) await waitForLayoutStable();
      else await waitForNextPaint();
      await task();
    } catch {
      // Animation failures are intentionally isolated from gameplay.
    }
  }

  async function startLocalPassAnimation(force = false): Promise<void> {
    const key = currentLocalPassKey();
    const cardIds = localPassCardIds();
    if (!key || !cardIds.length) return;
    if (!force && (key === localPassPlayedKey || key === localPassActiveKey || key === interruptedLocalPassKey)) return;

    const runId = ++localPassRunId;
    localPassActiveKey = key;
    localPassRoundKey = `${state.roomId}:${state.roundNo}:${state.passMode}`;
    await runAfterStableLayout(async () => {
      if (runId !== localPassRunId) return;
      await playLocalPassAnimation(cardIds, state.passMode, runtime());
      if (runId !== localPassRunId) return;
      localPassActiveKey = "";
      localPassPlayedKey = key;
    });
  }

  async function startPassFlowAnimation(force = false): Promise<void> {
    const key = currentPassFlowKey();
    const items = passFlowItems();
    if (!key || !items.length) return;
    if (!force && (key === passFlowPlayedKey || key === passFlowActiveKey || key === interruptedPassFlowKey)) return;

    const runId = ++passFlowRunId;
    passFlowActiveKey = key;
    await runAfterStableLayout(async () => {
      if (runId !== passFlowRunId) return;
      await playPassFlowAnimation(items, runtime());
      if (runId !== passFlowRunId) return;
      passFlowActiveKey = "";
      passFlowPlayedKey = key;
    });
  }

  async function startCollectAnimation(force = false): Promise<void> {
    const key = currentCollectKey();
    const trick = collectTrickPlays();
    const winner = collectWinnerView();
    if (!key || trick.length !== 4 || winner == null) return;
    if (!force && (key === collectPlayedKey || key === collectActiveKey || key === interruptedCollectKey)) return;

    const runId = ++collectRunId;
    collectActiveKey = key;
    await runAfterStableLayout(async () => {
      if (runId !== collectRunId) return;
      await playCollectAnimation(trick, winner, runtime());
      if (runId !== collectRunId) return;
      collectActiveKey = "";
      collectPlayedKey = key;
    }, false);
  }

  function clearRecoveryTimer(): void {
    if (recoveryTimer != null) window.clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }

  function scheduleRecovery(): void {
    clearRecoveryTimer();
    recoveryTimer = window.setTimeout(() => {
      recoveryTimer = null;
      replayInterruptedAnimations();
    }, LAYOUT_SETTLE_MS);
  }

  function interruptTransientAnimations(): void {
    if (localPassActiveKey) interruptedLocalPassKey = localPassActiveKey;
    if (passFlowActiveKey) interruptedPassFlowKey = passFlowActiveKey;
    if (collectActiveKey) interruptedCollectKey = collectActiveKey;

    localPassActiveKey = "";
    passFlowActiveKey = "";
    collectActiveKey = "";
    localPassRunId += 1;
    passFlowRunId += 1;
    collectRunId += 1;

    cancelRunningAnimations();
    clearAnimationLayer("passFlightLayer");
    clearAnimationLayer("collectFlightLayer");
    scheduleRecovery();
  }

  function replayInterruptedAnimations(): void {
    if (state.layout.layoutKey !== lastLayoutKey) return;

    if (interruptedLocalPassKey && interruptedLocalPassKey === currentLocalPassKey()) {
      interruptedLocalPassKey = "";
      void startLocalPassAnimation(true);
    } else if (interruptedLocalPassKey) {
      interruptedLocalPassKey = "";
    }

    if (interruptedPassFlowKey && interruptedPassFlowKey === currentPassFlowKey()) {
      interruptedPassFlowKey = "";
      void startPassFlowAnimation(true);
    } else if (interruptedPassFlowKey) {
      interruptedPassFlowKey = "";
    }

    if (interruptedCollectKey && interruptedCollectKey === currentCollectKey()) {
      interruptedCollectKey = "";
      void startCollectAnimation(true);
    } else if (interruptedCollectKey) {
      interruptedCollectKey = "";
    }
  }

  onDestroy(() => {
    clearRecoveryTimer();
    localPassRunId += 1;
    passFlowRunId += 1;
    collectRunId += 1;
    cancelRunningAnimations();
    clearAnimationLayer("passFlightLayer");
    clearAnimationLayer("collectFlightLayer");
  });
</script>

<div class="pass-flight-layer" id="passFlightLayer" aria-hidden="true"></div>
<div class="collect-flight-layer" id="collectFlightLayer" aria-hidden="true"></div>
