<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { GameState } from "../../stores/gameStore";
  import { PASS_HINTS } from "../../stores/gameStore";
  import { formatPhaseLabel, formatPassDirection, formatTrickSummary } from "../../utils/format";
  import { canRestartGame, getCurrentPlayerName } from "../../utils/gameState";

  export let state: GameState;

  const dispatch = createEventDispatcher<{
    centeraction: void;
    restartgame: void;
  }>();

  $: hasRoom = Boolean(state.roomId);
  $: showButton = state.connected && (!hasRoom || ["offline", "lobby", "pass", "roundEnd", "gameEnd"].includes(state.phase));
  $: buttonText = centerButtonText(state);
  $: buttonDisabled = state.phase === "pass" && (state.passSending || state.youPassed || state.selectedPass.size !== 3);
  $: canRestart = canRestartGame(state);
  $: message = centerMessage(state);
  $: passCounter = passCounterText(state);

  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const r = 162;
  const sweep = 72;

  function centerButtonText(value: GameState): string {
    if (!value.roomId || value.phase === "offline" || value.phase === "lobby") return "房间";
    if (value.phase === "pass") {
      if (value.passSending) return "传递中";
      return value.youPassed ? "等待中" : "传递";
    }
    if (value.phase === "roundEnd") return "下一局";
    if (value.phase === "gameEnd") return "成绩";
    return "";
  }

  function passCounterText(value: GameState): string {
    if (value.phase !== "pass") return "";
    if (value.passSending) return "传牌中";
    if (value.youPassed) return "已传牌";
    return `已选择 ${value.selectedPass.size}/3 张`;
  }

  function centerMessage(value: GameState): string {
    if (!value.connected) return value.connecting ? "正在连接联机服务端..." : "服务端未连接，可重连或刷新。";
    if (!value.roomId || value.phase === "offline") return "创建房间或输入房间号加入。";
    if (value.phase === "lobby") return value.isHost ? `房间 ${value.roomId}，等待玩家加入。` : `房间 ${value.roomId}，等待房主开始。`;
    if (value.phase === "deal") return "正在发牌...";
    if (value.phase === "pass") {
      if (value.passSending) return "正在传牌，请稍等。";
      return value.youPassed ? "你已完成传牌，等待其他玩家。" : PASS_HINTS[value.passMode] || PASS_HINTS[0];
    }
    if (value.phase === "play") {
      const winner = value.trickWinnerPlayer == null ? null : value.players[value.trickWinnerPlayer];
      if (value.comparingTrick) return winner ? `${winner.name} 暂时最大，正在比牌...` : "正在比牌收墩...";
      if (value.collectingTrick) return winner ? formatTrickSummary(winner.name, value.lastTrick?.points || 0) : "正在收墩...";
      if (value.currentPlayer === 0 && !value.busy) return `轮到你出牌。${value.heartsBroken ? "红桃已破。" : "红桃尚未破。"}`;
      return `等待 ${getCurrentPlayerName(value)} 出牌...`;
    }
    if (value.phase === "roundEnd") return `本局结束，${formatPassDirection(value.passMode)}。可查看牌桌或开始下一局。`;
    if (value.phase === "gameEnd") return "游戏结束，点击查看成绩。";
    return `等待联机状态同步... ${formatPhaseLabel(value.phase)}`;
  }

  function polar(deg: number): { x: number; y: number } {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  $: centerDeg = ({ 0: 180, 1: 270, 2: 0, 3: 90 } as Record<number, number>)[state.currentPlayer] ?? 90;
  $: p1 = polar(centerDeg - sweep / 2);
  $: p2 = polar(centerDeg + sweep / 2);
  $: arcPath = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  $: fanPath = `M ${cx} ${cy} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`;
</script>

<section class="center-ring">
  <div class="center-turn-arc" class:hidden={state.phase !== "play" || state.currentPlayer == null} id="turnArc" aria-hidden="true">
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id="turnArcFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff3a6" stop-opacity="0.40"></stop>
          <stop offset="52%" stop-color="#f0bf25" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#f0bf25" stop-opacity="0"></stop>
        </radialGradient>
      </defs>
      <circle class="ring-base" cx={cx} cy={cy} r={r}></circle>
      {#if state.currentPlayer === 0 && !state.comparingTrick && !state.collectingTrick}
        <circle class="self-wave-ring wave-one" cx={cx} cy={cy} r={r + 8}></circle>
        <circle class="self-wave-ring wave-two" cx={cx} cy={cy} r={r + 8}></circle>
      {/if}
      <path class="fan-fill" d={fanPath}></path>
      <path class="fan-arc" d={arcPath}></path>
    </svg>
  </div>
  <div class="round-title" id="roundTitle">{hasRoom ? `第 ${state.roundNo} 局` : "联机大厅"}</div>
  <div class="round-desc" id="message">{message}</div>
  {#if showButton}
    {#if state.phase === "pass"}
      <button class="center-btn" id="centerBtn" disabled={buttonDisabled} on:click={() => dispatch("centeraction")}>{buttonText}</button>
    {:else if state.phase === "gameEnd"}
      <div class="center-btn-row">
        <button class="center-btn" id="centerBtn" on:click={() => dispatch("centeraction")}>{buttonText}</button>
        <button class="center-btn center-restart-btn" id="centerRestartBtn" disabled={!canRestart} on:click={() => dispatch("restartgame")}>再来一局</button>
      </div>
    {:else}
      <button class="center-btn" id="centerBtn" on:click={() => dispatch("centeraction")}>{buttonText}</button>
    {/if}
  {/if}
  <div class="pass-counter" id="passCounter">{passCounter}</div>
</section>
