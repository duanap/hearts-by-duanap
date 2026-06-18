<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { clearClientCache, clearRoomError, savedNickname, saveNickname, showToast } from "../../stores/gameStore";
  import { ensureNickname, limitNickname, randomRomanceName } from "../../utils/format";

  export let open = false;
  export let state: GameState;

  const dispatch = createEventDispatcher<{
    close: void;
    create: { nickname: string };
    join: { roomId: string; nickname: string };
    fillbots: void;
    takeover: void;
    leave: void;
    disband: void;
    reconnect: void;
  }>();

  let mode: "choice" | "create" | "join" | "status" = "choice";
  let nickname = ensureNickname(savedNickname());
  let roomIdInput = "";
  let localError = "";
  let hadRoom = false;

  $: hasRoom = Boolean(state.roomId);
  $: panelMode = hasRoom ? "status" : mode;
  $: host = state.serverPlayers.find(player => player.id === state.hostId) || state.serverPlayers[0];
  $: inLobby = hasRoom && state.phase === "lobby";
  $: hasLeftHumans = state.serverPlayers.some(player => !player.isBot && player.leftRoom);
  $: hasOfflineHumans = state.serverPlayers.some(player => !player.isBot && !player.connected && !player.leftRoom);
  $: showFill = hasRoom && state.isHost && state.phase !== "gameEnd" && ((inLobby && state.serverPlayers.length < 4) || hasLeftHumans);
  $: showTakeover = hasRoom && state.isHost && state.phase !== "gameEnd" && hasOfflineHumans;
  $: inlineError = localError || state.roomError;
  $: createBusy = state.roomBusy === "create";
  $: joinBusy = state.roomBusy === "join";
  $: leaveBusy = state.roomBusy === "leave";
  $: disbandBusy = state.roomBusy === "disband";
  $: fillBusy = state.aiBusy === "fill";
  $: takeoverBusy = state.aiBusy === "takeover";
  $: if (state.roomId) roomIdInput = state.roomId;
  $: {
    if (hadRoom && !hasRoom) {
      mode = "choice";
      roomIdInput = "";
      localError = "";
    }
    hadRoom = hasRoom;
  }

  function clearError() {
    localError = "";
    clearRoomError();
  }

  function setMode(next: "choice" | "create" | "join") {
    mode = next;
    clearError();
    if (next !== "join" && !hasRoom) roomIdInput = "";
  }

  function updateNickname(value: string) {
    nickname = limitNickname(value);
    clearError();
  }

  function rerollNickname() {
    nickname = limitNickname(randomRomanceName(nickname));
    saveNickname(nickname);
    clearError();
    showToast(`已随机为：${nickname}`, 1500, "success");
  }

  function copyRoomId() {
    if (!state.roomId) return;
    void navigator.clipboard?.writeText(state.roomId);
    showToast("房间号已复制。", 1500, "success");
  }

  function normalizedNickname(): string {
    const value = limitNickname(nickname);
    nickname = value;
    if (!value) {
      localError = "请输入昵称，或点击骰子随机昵称。";
      return "";
    }
    saveNickname(value);
    return value;
  }

  function submitCreate() {
    clearError();
    const value = normalizedNickname();
    if (!value) return;
    dispatch("create", { nickname: value });
  }

  function submitJoin() {
    clearError();
    const roomId = roomIdInput.replace(/\D/g, "").slice(0, 4);
    roomIdInput = roomId;
    if (roomId.length !== 4) {
      localError = "请输入 4 位数字房间号。";
      return;
    }
    const value = normalizedNickname();
    if (!value) return;
    dispatch("join", { roomId, nickname: value });
  }

  function leaveRoom() {
    clearError();
    if (!state.roomId) return;
    if (!window.confirm(`确定退出房间 ${state.roomId} 吗？之后可重新输入房间号加入。`)) return;
    dispatch("leave");
  }

  function disbandRoom() {
    clearError();
    if (!state.roomId || !state.isHost) return;
    if (!window.confirm(`确定要解散房间 ${state.roomId} 吗？所有玩家都会退出当前牌局。`)) return;
    dispatch("disband");
  }

  function playerStatus(player: GameState["serverPlayers"][number]): string {
    if (player.aiControlled) return "离线 · AI托管中";
    if (player.isBot) return "在线";
    if (player.leftRoom) return "已退出";
    return player.connected ? "在线" : "离线";
  }
</script>

<div class="modal" class:hidden={!open} id="roomModal">
  <button type="button" class="modal-mask" id="roomMask" aria-label="关闭房间弹窗" style="border:0;padding:0;" on:click={() => dispatch("close")}></button>
  <div class="modal-card">
    <button class="modal-close" id="closeRoomBtn" on:click={() => dispatch("close")}>×</button>
    <div class="room-title-row">
      <h2 class="modal-title" id="roomTitle">{hasRoom ? `房间号 ${state.roomId}` : panelMode === "create" ? "创建房间" : panelMode === "join" ? "加入房间" : "联机房间"}</h2>
      <button type="button" class="title-copy-btn" class:hidden={!hasRoom} id="copyRoomTitleBtn" on:click={copyRoomId}>复制</button>
    </div>
    <div class="modal-subtitle" id="roomSubtitle">
      {#if hasRoom}
        {state.isHost ? "满 4 人会自动开始，人数不足可 AI 补位，也可以解散房间。" : "等待房主开始；你可以主动退出房间，之后仍可用房间号加入。"}
      {:else if panelMode === "create"}
        填写昵称后创建房间，系统会生成 4 位数字房间号。
      {:else if panelMode === "join"}
        填写昵称，并输入好友给你的 4 位数字房间号。
      {:else}
        请选择创建房间或加入房间。
      {/if}
    </div>

    <div class="room-choice-panel" class:hidden={panelMode !== "choice"} id="roomChoicePanel">
      <div class="room-choice-grid">
        <button class="action-btn room-choice-btn" id="chooseCreateRoomBtn" on:click={() => setMode("create")} disabled={createBusy || joinBusy}>
          <strong>创建房间</strong>
          <span>生成 4 位房间号，邀请好友加入</span>
        </button>
        <button class="action-btn room-choice-btn secondary" id="chooseJoinRoomBtn" on:click={() => setMode("join")} disabled={createBusy || joinBusy}>
          <strong>加入房间</strong>
          <span>输入好友给你的 4 位房间号</span>
        </button>
      </div>
    </div>

    <div class="room-action-panel" class:hidden={!["create", "join"].includes(panelMode)} id="roomActionPanel">
      <div class="room-form">
        <label class="room-field" class:has-error={Boolean(inlineError && !hasRoom)}>
          <div class="field-title-row"><span>昵称</span></div>
          <div class="input-with-btn">
            <input class="room-input" id="nicknameInput" maxlength="20" placeholder="例如：赵云" value={nickname} on:input={(event) => updateNickname(event.currentTarget.value)} disabled={createBusy || joinBusy} />
            <button type="button" class="dice-icon-btn" id="randomNicknameIconBtn" title="换一个随机角色名" on:click={rerollNickname} disabled={createBusy || joinBusy}>🎲</button>
          </div>
        </label>
        <label class="room-field room-id-field" class:hidden={panelMode !== "join"} class:has-error={Boolean(inlineError)} id="roomIdField">
          房间号
          <input class="room-input" id="roomIdInput" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="例如：1234" value={roomIdInput} on:input={(event) => { roomIdInput = event.currentTarget.value.replace(/\D/g, "").slice(0, 4); clearError(); }} disabled={joinBusy} />
          <div class="room-inline-error" class:hidden={!inlineError} id="roomInlineError">{inlineError}</div>
        </label>
      </div>
      {#if inlineError && panelMode === "create"}
        <div class="room-inline-error">{inlineError}</div>
      {/if}
      <div class="modal-actions">
        <button class="action-btn mode-only" class:hidden={panelMode !== "create"} id="createRoomBtn" on:click={submitCreate} disabled={createBusy || joinBusy}>{createBusy ? "创建中" : "确认创建"}</button>
        <button class="action-btn mode-only" class:hidden={panelMode !== "join"} id="joinRoomBtn" on:click={submitJoin} disabled={createBusy || joinBusy}>{joinBusy ? "加入中" : "确认加入"}</button>
        <button class="action-btn secondary" id="backRoomChoiceBtn" on:click={() => setMode("choice")} disabled={createBusy || joinBusy}>返回重选</button>
      </div>
    </div>

    <div class="room-status" class:hidden={!hasRoom} id="roomStatus">
      <span class="room-status-left">
        服务端：<span class={`service-state ${state.connected ? "online" : "offline"}`}>{state.connected ? "已连接" : state.connecting ? "连接中" : "未连接"}</span>
        <span class="room-status-actions"><button class="room-status-action" type="button" on:click={() => dispatch("reconnect")}>重连服务端</button></span>
      </span>
      <span class="room-status-right">当前房主：<strong class="room-host-inline">{host?.name || "未知"}</strong></span>
    </div>

    <div class="room-players" class:hidden={!hasRoom} id="roomPlayers">
      {#if state.serverPlayers.length}
        {#each state.serverPlayers as player, index}
          <div class="room-player" class:host-player={player.id === state.hostId}>
            <span class="room-player-main">
              <span>{index + 1}. {player.name}</span>
              {#if player.id === state.hostId}<span class="host-badge">👑 房主</span>{/if}
              {#if player.isBot}<span class="room-player-bot">{player.aiControlled ? "AI托管" : `${player.avatar} AI`}</span>{/if}
            </span>
            <span class="room-player-status">{#if player.passed}<span class="pass-ready-pill">已传牌</span>{/if}{playerStatus(player)}</span>
          </div>
        {/each}
      {:else}
        <div class="room-player"><span>等待玩家</span><span>可邀请好友加入</span></div>
      {/if}
    </div>

    <div class="modal-actions">
      <button class="action-btn room-control" class:hidden={!showFill} id="fillBotsBtn" on:click={() => dispatch("fillbots")} disabled={fillBusy || takeoverBusy || !state.connected}>{fillBusy ? "发送中" : hasLeftHumans ? "AI补位" : "AI补位开始"}</button>
      <button class="action-btn room-control" class:hidden={!showTakeover} id="takeoverBotsBtn" on:click={() => dispatch("takeover")} disabled={fillBusy || takeoverBusy || !state.connected}>{takeoverBusy ? "发送中" : "AI接管离线"}</button>
      <button class="action-btn secondary room-control room-cache-btn" type="button" id="clearCacheBtn" on:click={() => void clearClientCache()}>刷新缓存</button>
      <button class="action-btn secondary room-control" class:hidden={!hasRoom} id="leaveRoomBtn" on:click={leaveRoom} disabled={leaveBusy || !state.connected}>{leaveBusy ? "退出中" : "退出房间"}</button>
      <button class="action-btn danger room-control" class:hidden={!(hasRoom && state.isHost)} id="disbandRoomBtn" on:click={disbandRoom} disabled={disbandBusy || !state.connected}>{disbandBusy ? "解散中" : "解散房间"}</button>
      <button class="action-btn secondary" id="closeRoomBottomBtn" on:click={() => dispatch("close")}>关闭</button>
    </div>
  </div>
</div>
