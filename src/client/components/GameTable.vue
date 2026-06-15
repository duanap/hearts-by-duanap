<template>
  <div class="game-table">
    <PlayerSeat :player="game.players[2]" position="north" :isTurn="game.currentPlayer === 2" />
    <PlayerSeat :player="game.players[1]" position="west" :isTurn="game.currentPlayer === 1" />
    <PlayerSeat :player="game.players[3]" position="east" :isTurn="game.currentPlayer === 3" />
    <PlayerSeat :player="game.players[0]" position="south" :isTurn="game.currentPlayer === 0" />

    <div class="opponent-hand north" v-if="game.players[2].handCount > 0">
      <div class="card-back" v-for="i in Math.min(game.players[2].handCount, 13)" :key="i"
        :style="{ left: getBackCardPosition(i, game.players[2].handCount, 'horizontal') }"></div>
    </div>
    <div class="opponent-hand west" v-if="game.players[1].handCount > 0">
      <div class="card-back" v-for="i in Math.min(game.players[1].handCount, 13)" :key="i"
        :style="{ top: getBackCardPosition(i, game.players[1].handCount, 'vertical') }"></div>
    </div>
    <div class="opponent-hand east" v-if="game.players[3].handCount > 0">
      <div class="card-back" v-for="i in Math.min(game.players[3].handCount, 13)" :key="i"
        :style="{ top: getBackCardPosition(i, game.players[3].handCount, 'vertical') }"></div>
    </div>

    <CenterRing @centerAction="onCenterAction" />

    <section class="trick-area" :class="{ judging: game.comparingTrick, collecting: game.collectingTrick }">
      <div v-for="(play, i) in trickSlots" :key="i" class="slot" :class="slotPosition(i)">
        <span v-if="play && isFirstPlay(play.player)" class="lead-tag">首出</span>
        <div v-if="play" class="card small" :class="play.card.suit === 'H' || (play.card.suit === 'S' && play.card.rank === 12) ? 'red' : 'black'">
          <div class="card-corner">{{ rankText(play.card.rank) }}<br>{{ suitSymbol(play.card.suit) }}</div>
          <div class="card-pip">{{ suitSymbol(play.card.suit) }}</div>
          <div class="card-corner bottom">{{ rankText(play.card.rank) }}<br>{{ suitSymbol(play.card.suit) }}</div>
        </div>
      </div>
    </section>

    <PlayerHand
      :cards="game.players[0].hand"
      :selectedIds="game.selectedPass"
      :legalIds="game.legalCardIds"
      :highlightIds="game.receivedHighlightIds"
      :isPlayPhase="game.phase === 'play'"
      @selectCard="onCardSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { SUITS, rankText as getRankText } from '../types'
import type { Card } from '../types'
import PlayerSeat from './PlayerSeat.vue'
import PlayerHand from './PlayerHand.vue'
import CenterRing from './CenterRing.vue'

const emit = defineEmits<{
  playCard: [cardId: string]
  passCards: [cardIds: string[]]
  centerAction: []
}>()

const game = useGameStore()

const trickSlots = computed(() => {
  const slots: (typeof game.trick[0] | null)[] = [null, null, null, null]
  for (const play of game.trick) {
    slots[play.player] = play
  }
  return slots
})

function slotPosition(i: number) {
  return ['south', 'west', 'north', 'east'][i]
}

function isFirstPlay(playerIndex: number): boolean {
  return game.trick.length >= 1 && game.trick[0]?.player === playerIndex
}

function rankText(rank: number) {
  return getRankText(rank)
}

function suitSymbol(suit: string) {
  return SUITS[suit as keyof typeof SUITS]?.symbol || '?'
}

function getBackCardPosition(index: number, total: number, direction: 'horizontal' | 'vertical'): string {
  const spacing = direction === 'horizontal' ? 26 : 24
  return `${(index - 1) * spacing}px`
}

function onCardSelect(card: Card) {
  if (game.phase === 'pass' && !game.youPassed) {
    if (game.selectedPass.has(card.id)) {
      game.selectedPass.delete(card.id)
    } else if (game.selectedPass.size < 3) {
      game.selectedPass.add(card.id)
    }
  } else if (game.phase === 'play' && game.isYourTurn && game.legalCardIds.has(card.id)) {
    emit('playCard', card.id)
  }
}

function onCenterAction() {
  emit('centerAction')
}
</script>

<style lang="scss" scoped>
.game-table {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.trick-area {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 360px;
  height: 300px;
  transform: translate(-50%, -50%);
  z-index: 18;
  pointer-events: none;
}

.slot {
  position: absolute;
  width: 82px;
  height: 112px;
  display: grid;
  place-items: center;
}

.slot.south { left: 50%; bottom: -10px; transform: translateX(-50%); }
.slot.west { left: 0; top: 50%; transform: translateY(-50%); }
.slot.north { left: 50%; top: -10px; transform: translateX(-50%); }
.slot.east { right: 0; top: 50%; transform: translateY(-50%); }

.lead-tag {
  position: absolute;
  top: -8px;
  left: -4px;
  padding: 1px 5px;
  border-radius: 999px;
  color: #ffefc5;
  background: rgba(255, 92, 58, .24);
  border: 1px solid rgba(255, 112, 72, .42);
  font-size: 8px;
  font-weight: 950;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.4;
  pointer-events: none;
}

.opponent-hand {
  position: absolute;
  z-index: 8;
  pointer-events: none;
}

.opponent-hand.north {
  left: 50%;
  top: 48px;
  width: min(380px, 48%);
  height: 114px;
  transform: translateX(-50%);
  display: flex;
}

.opponent-hand.west {
  left: 68px;
  top: 24%;
  width: 160px;
  height: 300px;
}

.opponent-hand.east {
  right: 68px;
  top: 24%;
  width: 160px;
  height: 300px;
}

.card-back {
  position: absolute;
  width: 60px;
  height: 88px;
  border-radius: 16px;
  border: 2px solid rgba(255, 248, 217, .9);
  background:
    radial-gradient(circle at 24% 22%, rgba(255,255,255,.6), transparent 18%),
    radial-gradient(circle at 70% 76%, rgba(255, 230, 125, .34), transparent 20%),
    repeating-linear-gradient(45deg, rgba(255,255,255,.18) 0 5px, transparent 5px 14px),
    linear-gradient(145deg, #6bcf70, #3f9d58);
  box-shadow: 0 8px 0 rgba(57, 103, 47, .25), 0 11px 16px rgba(65, 75, 42, .2);

  &::after {
    content: '🍃';
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: rgba(255, 252, 218, .95);
    font-family: inherit;
    font-size: 27px;
    text-shadow: 0 2px 0 rgba(58, 105, 47, .28);
  }
}
</style>
