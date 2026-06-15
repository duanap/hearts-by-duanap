<template>
  <div class="player-hand" v-if="cards.length">
    <PlayingCard
      v-for="(card, index) in cards"
      :key="card.id"
      :card="card"
      :rotation="getRotation(index, cards.length)"
      :selected="selectedIds.has(card.id)"
      :illegal="!legalIds.has(card.id) && isPlayPhase"
      :isJustReceived="highlightIds.has(card.id)"
      @select="onCardSelect(card)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card as CardType } from '../types'
import PlayingCard from './Card.vue'

const props = defineProps<{
  cards: CardType[]
  selectedIds: Set<string>
  legalIds: Set<string>
  highlightIds: Set<string>
  isPlayPhase: boolean
}>()

const emit = defineEmits<{
  selectCard: [card: CardType]
}>()

function getRotation(index: number, total: number): string {
  if (total <= 1) return '0deg'
  const spread = Math.min(total * 6, 72)
  const start = -spread / 2
  const step = spread / (total - 1)
  return `${start + step * index}deg`
}

function onCardSelect(card: CardType) {
  emit('selectCard', card)
}
</script>

<style lang="scss" scoped>
.player-hand {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(860px, 72vw);
  height: 190px;
  transform: translateX(-50%);
  z-index: 22;
}

:deep(.card):hover {
  filter: brightness(1.04) saturate(1.04);
  box-shadow: 0 13px 0 rgba(123, 82, 43, .14), 0 18px 22px rgba(65, 71, 39, .2), inset 0 1px 0 rgba(255,255,255,.92);
}
</style>
