<script lang="ts">
  import { onMount } from "svelte";
  import TableScene from "./components/table/TableScene.svelte";
  import RoomModal from "./components/modals/RoomModal.svelte";
  import AiPromptModal from "./components/modals/AiPromptModal.svelte";
  import ConnectionModal from "./components/modals/ConnectionModal.svelte";
  import LogModal from "./components/modals/LogModal.svelte";
  import LandscapePromptModal from "./components/modals/LandscapePromptModal.svelte";
  import ResultModal from "./components/modals/ResultModal.svelte";
  import RulesModal from "./components/modals/RulesModal.svelte";
  import RoundTableModal from "./components/modals/RoundTableModal.svelte";
  import SettingsModal from "./components/modals/SettingsModal.svelte";
  import VersionLogModal from "./components/modals/VersionLogModal.svelte";
  import ConnectionBanner from "./components/overlays/ConnectionBanner.svelte";
  import LastTrickPopover from "./components/overlays/LastTrickPopover.svelte";
  import OverlayLayer from "./components/overlays/OverlayLayer.svelte";
  import ToastLayer from "./components/overlays/ToastLayer.svelte";
  import {
    applyPlayError,
    applyServerState,
    clearCardSelection,
    clearPassSending,
    clearRoomError,
    closeLastTrick,
    closeModal,
    closeResultModal,
    closeRoundTableModal,
    currentGameState,
    gameState,
    handleError,
    handleLeftRoom,
    handleRoomClosed,
    handleRoomCreated,
    enqueueInteraction,
    markPassSending,
    openInteractionPanel,
    openLastTrick,
    openLogModal,
    openModal,
    openResultModal,
    openRoundTableModal,
    openRulesModal,
    openSettingsModal,
    openVersionLogModal,
    recordPong,
    saveNickname,
    selectForPass,
    selectForPlay,
    setAiBusy,
    setConnectionModalOpen,
    setConnectionStatus,
    setForceLandscape,
    setFullscreenActive,
    setLayoutState,
    setOrientationLocked,
    setPlaySending,
    setRoomBusy,
    showHandTip,
    showToast,
    sendInteraction
  } from "./stores/gameStore";
  import { wsClient } from "./services/wsClient";
  import { playGameSound, type GameSound } from "./services/audio";
  import {
    isFullscreenActive,
    listenLayoutChanges,
    markLandscapePromptShown,
    shouldShowLandscapePrompt,
    toggleAppFullscreen,
    tryLockDeviceLandscape,
    updateLayoutState
  } from "./services/layout";
  import type { InteractionMenuAnchor, InteractionType, ServerMessage } from "./types/messages";
  import type { InteractionItem } from "./utils/interactions";
  import { explainIllegalCard } from "./utils/gameState";

  let roomModalOpen = false;
  let mounted = false;
  let lastSyncedForceLandscape: boolean | null = null;

  $: roomModalOpen = $gameState.modals.room;

  function toast(message: string, type: "info" | "success" | "warning" | "error" = "info") {
    showToast(message, 1800, type);
  }

  function sound(kind: GameSound) {
    playGameSound(kind, currentGameState().settings);
  }

  function playStateSounds(before: ReturnType<typeof currentGameState>, after: ReturnType<typeof currentGameState>) {
    if (!before.roomId && after.roomId) sound("success");
    if (after.phase === "play" && after.currentPlayer === 0 && before.currentPlayer !== 0 && !after.busy && !after.comparingTrick && !after.collectingTrick) {
      sound("turn");
    }
    const beforeLast = before.lastTrick ? `${before.roomId}:${before.roundNo}:${before.lastTrick.trickNo}:${before.lastTrick.winnerPlayer}` : "";
    const afterLast = after.lastTrick ? `${after.roomId}:${after.roundNo}:${after.lastTrick.trickNo}:${after.lastTrick.winnerPlayer}` : "";
    if (afterLast && beforeLast !== afterLast) sound("trick");
    if (!["roundEnd", "gameEnd"].includes(before.phase) && ["roundEnd", "gameEnd"].includes(after.phase)) sound("roundEnd");
    if (after.moonShooter != null && before.moonShooter !== after.moonShooter) sound("moon");
  }

  function openRoomModal() {
    openModal("room");
  }

  function closeRoomModal() {
    closeModal("room");
  }

  function handleServerMessage(message: ServerMessage) {
    switch (message.type) {
      case "pong":
        recordPong(message.at);
        return;
      case "state":
        const before = currentGameState();
        applyServerState(message);
        playStateSounds(before, currentGameState());
        return;
      case "roomCreated":
        handleRoomCreated(message);
        sound("success");
        return;
      case "roomClosed":
        handleRoomClosed(message);
        openRoomModal();
        return;
      case "leftRoom":
        handleLeftRoom(message);
        openRoomModal();
        return;
      case "error":
        handleError(message);
        sound("error");
        return;
    }
  }

  function connect() {
    wsClient.connect({
      onMessage: handleServerMessage,
      onStatus: status => {
        setConnectionStatus(status.connected, status.connecting, status.error || "");
        if (!status.connected && !status.connecting && !currentGameState().connectionManualClosed) {
          setConnectionModalOpen(true, false);
        }
      },
      onOpen: () => {
        wsClient.hello(currentGameState().roomId);
      }
    });
  }

  onMount(() => {
    if (import.meta.env.DEV) {
      void import("./services/devTools").then(module => module.installDevTools());
    }
    syncLayoutState(false);
    const cleanupLayoutListeners = listenLayoutChanges(syncLayoutState);
    connect();
    if (!currentGameState().roomId) openRoomModal();
    mounted = true;
    window.setTimeout(maybeShowLandscapePrompt, 320);
    return () => {
      cleanupLayoutListeners();
      wsClient.disconnect();
    };
  });

  $: if (mounted) {
    if (lastSyncedForceLandscape !== $gameState.forceLandscape) {
      syncLayoutState(false);
    }
    if (($gameState.forceLandscape || !($gameState.settings.landscapePromptEnabled)) && $gameState.modals.landscapePrompt) {
      closeModal("landscapePrompt");
    }
    maybeShowLandscapePrompt();
  }

  function syncLayoutState(allowPrompt = true) {
    const state = currentGameState();
    const layout = updateLayoutState(state.forceLandscape);
    lastSyncedForceLandscape = state.forceLandscape;
    setLayoutState(layout);
    setFullscreenActive(isFullscreenActive());
    if (allowPrompt) maybeShowLandscapePrompt();
  }

  function maybeShowLandscapePrompt() {
    const state = currentGameState();
    if (state.activeModal && state.activeModal !== "landscapePrompt") return;
    if (!shouldShowLandscapePrompt(state.forceLandscape, state.settings.landscapePromptEnabled)) return;
    markLandscapePromptShown();
    openModal("landscapePrompt");
  }

  function createRoom(event: CustomEvent<{ nickname: string }>) {
    clearRoomError();
    saveNickname(event.detail.nickname);
    setRoomBusy("create");
    if (!wsClient.createRoom(event.detail.nickname)) {
      setRoomBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function joinRoom(event: CustomEvent<{ roomId: string; nickname: string }>) {
    clearRoomError();
    saveNickname(event.detail.nickname);
    setRoomBusy("join");
    if (!wsClient.joinRoom(event.detail.roomId, event.detail.nickname)) {
      setRoomBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function leaveRoom() {
    clearRoomError();
    setRoomBusy("leave");
    if (!wsClient.leaveRoom()) {
      setRoomBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function disbandRoom() {
    clearRoomError();
    setRoomBusy("disband");
    if (!wsClient.disbandRoom()) {
      setRoomBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function fillBotsAndStart() {
    setAiBusy("fill");
    if (!wsClient.fillBotsAndStart()) {
      setAiBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function takeoverOffline() {
    setAiBusy("takeover");
    if (!wsClient.takeoverOffline()) {
      setAiBusy(null);
      toast("尚未连接服务端，正在尝试重连。", "warning");
    }
  }

  function closeAiPrompt() {
    closeModal("aiPrompt");
  }

  function confirmAiPrompt(event: CustomEvent<"fill" | "takeover">) {
    if (event.detail === "fill") fillBotsAndStart();
    else takeoverOffline();
    closeAiPrompt();
  }

  function reconnect() {
    setConnectionModalOpen(true, false);
    wsClient.reconnect();
  }

  function submitSelectedPass() {
    const state = currentGameState();
    const cards = Array.from(state.selectedPass);
    const passMode = state.passMode;
    if (state.passSending) {
      showHandTip("传牌中，请稍等。", 1700, "info");
      return;
    }
    if (state.youPassed) {
      showHandTip("你已完成传牌，等待其他玩家。", 1700, "info");
      return;
    }
    if (cards.length !== 3) {
      showHandTip("请选择 3 张牌。", 1700, "warning");
      return;
    }

    markPassSending(cards);
    sound("pass");
    window.setTimeout(() => {
      if (!currentGameState().passSending) return;
      if (!wsClient.passCards(cards)) {
        clearPassSending();
        showHandTip("尚未连接服务端，正在尝试重连。", 1900, "warning");
      }
    }, 360);
  }

  function handleCenterAction() {
    const state = currentGameState();
    if (!state.roomId || state.phase === "offline" || state.phase === "lobby") {
      openRoomModal();
      return;
    }
    if (state.phase === "pass") {
      submitSelectedPass();
      return;
    }
    if (state.phase === "roundEnd") {
      wsClient.startNextRound();
      return;
    }
    if (state.phase === "gameEnd") {
      openResultModal();
    }
  }

  function handleOpenLastTrick() {
    const state = currentGameState();
    if (!state.lastTrick || !state.lastTrick.cards?.length) {
      showHandTip("暂无上一轮出牌记录。", 1700, "info");
      return;
    }
    openLastTrick();
  }

  function handleOpenRoundTable() {
    const state = currentGameState();
    if (!state.roundTable) {
      showHandTip("当前还没有可查看的牌桌记录。", 1700, "info");
      return;
    }
    openRoundTableModal();
  }

  function handleOpenInteraction(event: CustomEvent<{ viewIndex: number; anchor: InteractionMenuAnchor }>) {
    openInteractionPanel(event.detail.viewIndex, event.detail.anchor, "target");
  }

  function handleSendInteraction(event: CustomEvent<{
    kind: InteractionType;
    itemOverride?: InteractionItem;
    globalCooldown?: boolean;
    targetViewIndex: number;
  }>) {
    const prepared = sendInteraction(event.detail.kind, {
      itemOverride: event.detail.itemOverride,
      globalCooldown: event.detail.globalCooldown,
      targetViewIndex: event.detail.targetViewIndex
    });
    if (!prepared) {
      sound("error");
      return;
    }
    if (!wsClient.interaction(prepared.payload)) {
      enqueueInteraction({ ...prepared.event, localOnly: true });
      toast("尚未连接服务端，互动以本地提示显示。", "warning");
    }
  }

  function startNextRound() {
    if (!wsClient.startNextRound()) {
      toast("尚未连接服务端，正在尝试重连。", "warning");
      return;
    }
    closeResultModal();
    closeRoundTableModal();
  }

  function restartGame() {
    if (!wsClient.restartGame()) {
      toast("尚未连接服务端，正在尝试重连。", "warning");
      return;
    }
    closeResultModal();
    closeRoundTableModal();
  }

  function handleCardClick(event: CustomEvent<string>) {
    const state = currentGameState();
    const cardId = event.detail;
    const card = state.players[0]?.hand.find(item => item.id === cardId) || null;

    if (state.phase === "pass") {
      selectForPass(cardId);
      return;
    }

    if (state.phase === "play") {
      if (!card) {
        showHandTip("这张牌不在你的手牌中。", 1700, "warning");
        return;
      }
      if (state.playSending) {
        showHandTip("正在出牌，请稍等。", 1700, "info");
        return;
      }
      if (state.currentPlayer !== 0 || state.busy || state.comparingTrick || state.collectingTrick) {
        sound("error");
        applyPlayError(explainIllegalCard(card, state), card);
        return;
      }
      if (!state.legalCardIds.has(cardId)) {
        sound("error");
        applyPlayError(explainIllegalCard(card, state), card);
        return;
      }

      selectForPlay(cardId);
      setPlaySending(true);
      sound("play");
      if (!wsClient.playCard(cardId)) {
        setPlaySending(false);
        showHandTip("尚未连接服务端，正在尝试重连。", 1900, "warning");
        return;
      }
      clearCardSelection();
      return;
    }

    showHandTip("当前不能操作手牌。", 1700, "info");
  }

  async function toggleLandscapeMode() {
    const enabling = !currentGameState().forceLandscape;
    if (enabling) {
      const locked = await tryLockDeviceLandscape();
      setOrientationLocked(locked);
      setForceLandscape(true);
      closeModal("landscapePrompt");
      showToast(locked ? "已尝试锁定系统横屏，未自动进入全屏。" : "当前浏览器不支持自动锁定方向，已启用游戏内横屏模式。", 2600, "info");
      return;
    }

    setOrientationLocked(false);
    setForceLandscape(false);
    showToast("已退出横屏显示，全屏状态不受影响。", 2200, "info");
  }

  async function toggleFullscreen() {
    try {
      const active = await toggleAppFullscreen();
      setFullscreenActive(active);
      showToast(active ? "已进入全屏；可继续单独切换横屏。" : "已退出全屏；横屏状态不受影响。", 2200, "info");
    } catch {
      setFullscreenActive(isFullscreenActive());
      showToast("当前浏览器不支持全屏，或需要在手机浏览器中打开。", 2600, "warning");
    }
  }
</script>

<TableScene
  state={$gameState}
  on:openroom={openRoomModal}
  on:openconnection={() => setConnectionModalOpen(true, false)}
  on:opensettings={openSettingsModal}
  on:centeraction={handleCenterAction}
  on:restartgame={restartGame}
  on:openlasttrick={handleOpenLastTrick}
  on:openroundtable={handleOpenRoundTable}
  on:openinteraction={handleOpenInteraction}
  on:cardclick={handleCardClick}
  on:togglelandscape={toggleLandscapeMode}
  on:togglefullscreen={toggleFullscreen}
/>

<ConnectionBanner state={$gameState} on:openconnection={() => setConnectionModalOpen(true, false)} />
<ToastLayer state={$gameState} />
<OverlayLayer state={$gameState} on:interaction={handleSendInteraction} />
<LastTrickPopover state={$gameState} on:close={closeLastTrick} />

<RoomModal
  open={roomModalOpen}
  state={$gameState}
  on:close={closeRoomModal}
  on:create={createRoom}
  on:join={joinRoom}
  on:fillbots={fillBotsAndStart}
  on:takeover={takeoverOffline}
  on:leave={leaveRoom}
  on:disband={disbandRoom}
  on:reconnect={reconnect}
/>

<AiPromptModal
  state={$gameState}
  on:close={closeAiPrompt}
  on:confirm={confirmAiPrompt}
/>

<ConnectionModal
  state={$gameState}
  on:close={() => setConnectionModalOpen(false, true)}
  on:reconnect={reconnect}
  on:reload={() => location.reload()}
  on:openroom={() => { setConnectionModalOpen(false, true); openRoomModal(); }}
/>

<SettingsModal
  state={$gameState}
  on:close={() => closeModal("settings")}
  on:log={() => { closeModal("settings"); openLogModal(); }}
  on:rules={() => { closeModal("settings"); openRulesModal(); }}
  on:version={() => { closeModal("settings"); openVersionLogModal(); }}
/>

<LogModal
  state={$gameState}
  on:close={() => closeModal("log")}
/>

<RulesModal
  state={$gameState}
  on:close={() => closeModal("rules")}
/>

<VersionLogModal
  state={$gameState}
  on:close={() => closeModal("versionLog")}
/>

<LandscapePromptModal
  state={$gameState}
  on:close={() => closeModal("landscapePrompt")}
  on:enable={toggleLandscapeMode}
/>

<ResultModal
  state={$gameState}
  on:close={closeResultModal}
  on:next={startNextRound}
  on:restart={restartGame}
  on:roundtable={handleOpenRoundTable}
/>

<RoundTableModal
  state={$gameState}
  on:close={closeRoundTableModal}
/>
