<template>
  <div class="last-trick-popover hidden" :class="{ hidden: !show }">
    <div class="last-trick-title">
      <span>上一墩</span>
      <button class="last-trick-close" @click="$emit('close')">×</button>
    </div>
    <div class="last-trick-grid" v-if="lastTrick">
      <div v-for="(play, i) in orderedCards" :key="i"
        class="last-trick-cell" :class="{ 'is-winner': play.player === lastTrick.winnerPlayer, 'is-leader': play.player === lastTrick.leaderPlayer }">
        <div class="last-trick-name">
          {{ game.players[play.player]?.name || '?' }}
          <span v-if="play.player === lastTrick.leaderPlayer" class="last-trick-lead-badge">首出</span>
        </div>
        <div class="last-trick-card-row">
          <div class="last-trick-card" :class="play.card.suit === 'H' || (play.card.suit === 'S' && play.card.rank === 12) ? 'red' : ''">
            {{ rankText(play.card.rank) }}<br>{{ suitSymbol(play.card.suit) }}
          </div>
        </div>
        <div class="last-trick-meta">{{ relationLabel(play.player) }}</div>
      </div>
    </div>
    <div class="last-trick-summary" v-if="lastTrick">
      {{ winnerName }} 收墩 · {{ lastTrick.points }} 分
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { SUITS, rankText as getRankText } from '../types'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const game = useGameStore()
const lastTrick = computed(() => game.lastTrick)

const orderedCards = computed(() => {
  const cards = lastTrick.value?.cards || []
  const leader = lastTrick.value?.leaderPlayer
  const idx = cards.findIndex(p => p.player === leader)
  if (idx <= 0) return cards
  return [...cards.slice(idx), ...cards.slice(0, idx)]
})

const winnerName = computed(() => {
  const wp = lastTrick.value?.winnerPlayer
  return game.players[wp ?? 0]?.name || '玩家'
})

function rankText(r: number) { return getRankText(r) }
function suitSymbol(s: string) { return SUITS[s as keyof typeof SUITS]?.symbol || '?' }

function relationLabel(viewIndex: number) {
  if (viewIndex === 0) return '本家 / 自己'
  if (viewIndex === 1) return '上家'
  if (viewIndex === 2) return '对家'
  if (viewIndex === 3) return '下家'
  return '玩家'
}
</script>

<style lang="scss" scoped>
.last-trick-popover {
  position: fixed;
  left: 50vw;
  top: 50dvh;
  transform: translate(-50%, -50%);
  z-index: 2450;
  min-width: min(420px, calc(100vw - 28px));
  max-width: min(560px, calc(100vw - 28px));
  max-height: min(68dvh, 520px);
  overflow: auto;
  padding: 12px 14px;
  border-radius: 20px;
  color: #fff8dd;
  background: linear-gradient(180deg, rgba(17, 50, 26, .97), rgba(8, 28, 18, .97));
  border: 1px solid rgba(255, 232, 137, .24);
  box-shadow: 0 18px 48px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.10);
  backdrop-filter: blur(14px);
}
.last-trick-popover.hidden { display: none; }

.last-trick-title {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; margin-bottom: 8px; font-weight: 950; font-size: 14px; color: #ffe68f;
}
.last-trick-close {
  border: 0; border-radius: 999px; padding: 3px 8px;
  color: #ff3434; background: rgba(255,255,255,.10); cursor: pointer;
  font-weight: 950; font-size: 14px;
}
.last-trick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.last-trick-cell {
  min-width: 0; padding: 8px 6px; border-radius: 14px;
  background: rgba(255, 244, 194, .065); border: 1px solid rgba(255, 244, 194, .12);
  text-align: center; position: relative;
  &.is-winner { background: rgba(255, 232, 137, .14); border-color: rgba(255, 226, 118, .44); }
  &.is-leader { outline: 1px dashed rgba(255, 106, 66, .88); outline-offset: -5px; }
}
.last-trick-name {
  font-size: 11px; font-weight: 950; color: rgba(255, 249, 224, .82);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px;
  margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 3px;
}
.last-trick-card {
  margin: 5px auto 4px; width: 38px; height: 52px; border-radius: 8px;
  display: grid; place-items: center; font-size: 14px; font-weight: 950;
  background: linear-gradient(145deg, #fff9e8, #eadbb7); color: #1e1b16;
  box-shadow: 0 4px 10px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.64);
  &.red { color: #c0262d; }
}
.last-trick-meta { font-size: 10px; color: rgba(255, 249, 224, .58); font-weight: 900; }
.last-trick-lead-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 1px 5px; border-radius: 999px; color: #ffefc5;
  background: rgba(255, 92, 58, .24); border: 1px solid rgba(255, 112, 72, .42);
  font-size: 8px; font-weight: 950; white-space: nowrap;
}
.last-trick-summary {
  margin-top: 8px; padding: 6px 8px; border-radius: 12px;
  background: rgba(255, 232, 137, .10); color: #ffe68f;
  font-size: 12px; font-weight: 950; text-align: center;
}
</style>
