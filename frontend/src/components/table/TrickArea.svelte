<script lang="ts">
  import CardView from "./Card.svelte";
  import type { TrickPlay } from "../../types/messages";
  import type { ViewPlayer } from "../../stores/gameStore";

  export let trick: TrickPlay[] = [];
  export let comparingTrick = false;
  export let collectingTrick = false;
  export let trickWinnerPlayer: number | null = null;
  export let judgeText = "";
  export let players: ViewPlayer[] = [];
  export let lastTrickWinner: number | null = null;

  const slots = [
    { viewIndex: 0, position: "south", style: "--play-x:0px;--play-y:180px;" },
    { viewIndex: 1, position: "west", style: "--play-x:-190px;--play-y:0px;" },
    { viewIndex: 2, position: "north", style: "--play-x:0px;--play-y:-180px;" },
    { viewIndex: 3, position: "east", style: "--play-x:190px;--play-y:0px;" }
  ];

  const collectAnchors: Record<number, { x: number; y: number }> = {
    0: { x: 0, y: 82 },
    1: { x: -98, y: 0 },
    2: { x: 0, y: -82 },
    3: { x: 98, y: 0 }
  };

  const collectTargets: Record<number, { x: number; y: number }> = {
    0: { x: 0, y: 176 },
    1: { x: -212, y: 0 },
    2: { x: 0, y: -176 },
    3: { x: 212, y: 0 }
  };

  function resolveTrickWinner(plays: TrickPlay[]): number | null {
    const leadSuit = plays[0]?.card?.suit;
    if (!leadSuit || plays.length < 4) return null;

    let winner: TrickPlay | null = null;
    for (const play of plays) {
      if (play.card?.suit !== leadSuit) continue;
      if (!winner || Number(play.card.rank || 0) > Number(winner.card.rank || 0)) {
        winner = play;
      }
    }
    return winner?.player ?? null;
  }

  function slotClasses(slot: typeof slots[number], play: TrickPlay | undefined): string {
    const winnerPlayer = activeWinnerPlayer;
    return [
      "slot",
      slot.position,
      play ? "new-card" : "",
      comparingTrick && play ? "compare-candidate" : "",
      winnerPlayer != null && play && play.player === winnerPlayer ? "compare-winner" : "",
      comparingTrick && play && winnerPlayer != null && play.player !== winnerPlayer ? "compare-loser" : ""
    ].filter(Boolean).join(" ");
  }

  function slotStyle(slot: typeof slots[number]): string {
    const source = collectAnchors[slot.viewIndex] || { x: 0, y: 0 };
    const winner = activeWinnerPlayer;
    const target = winner == null ? source : collectTargets[winner] || collectAnchors[winner] || source;
    const collectX = Math.round(target.x - source.x);
    const collectY = Math.round(target.y - source.y);
    const collectRot = winner == null || slot.viewIndex === winner ? 0 : slot.viewIndex < winner ? 8 : -8;
    return `${slot.style}--collect-x:${collectX}px;--collect-y:${collectY}px;--collect-rot:${collectRot}deg;`;
  }

  $: playsByView = slots.map(slot => trick.find(item => item.player === slot.viewIndex));
  $: resolvedWinnerPlayer = resolveTrickWinner(trick);
  $: activeWinnerPlayer = trick.length === 4 && (comparingTrick || collectingTrick)
    ? resolvedWinnerPlayer ?? trickWinnerPlayer
    : null;
  $: winnerText = activeWinnerPlayer != null
    ? (judgeText || `${players[activeWinnerPlayer]?.name || "玩家"} 本墩最大牌`)
    : lastTrickWinner != null
      ? `${players[lastTrickWinner]?.name || "玩家"} 收下本墩`
      : "";
</script>

<section class="trick-area" class:judging={comparingTrick && trick.length === 4} class:collecting={collectingTrick && trick.length === 4}>
  <div class="center-turn-pointer hidden" id="turnPointer"></div>
  {#each slots as slot, index}
    {@const play = playsByView[index]}
    <div
      class={slotClasses(slot, play)}
      id={`slot${slot.viewIndex}`}
      style={slotStyle(slot)}
    >
      {#if play}
        {#key play.card.id}
          <CardView card={play.card} small extraClass="trick-card" />
        {/key}
      {/if}
    </div>
  {/each}
  <div class="judge-bubble" class:hidden={!winnerText}>{winnerText}</div>
</section>
