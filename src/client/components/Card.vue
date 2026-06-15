<template>
  <div
    class="card"
    :class="[colorClass, sizeClass, { selected, illegal, 'just-received': isJustReceived }]"
    :style="{ '--rot': rotation }"
    @click="$emit('select', card)"
  >
    <div class="card-corner">
      {{ rankText }}<br>{{ suitSymbol }}
    </div>
    <div class="card-pip">{{ suitSymbol }}</div>
    <div class="card-corner bottom">
      {{ rankText }}<br>{{ suitSymbol }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '../types'
import { SUITS, rankText as getRankText } from '../types'

const props = defineProps<{
  card: Card
  small?: boolean
  selected?: boolean
  illegal?: boolean
  rotation?: string
  isJustReceived?: boolean
}>()

defineEmits<{
  select: [card: Card]
}>()

const suitInfo = computed(() => SUITS[props.card.suit])
const suitSymbol = computed(() => suitInfo.value.symbol)
const rankText = computed(() => getRankText(props.card.rank))
const colorClass = computed(() => suitInfo.value.color)
const sizeClass = computed(() => props.small ? 'small' : '')
const rotation = computed(() => props.rotation || '0deg')
</script>

<style lang="scss" scoped>
.card {
  position: absolute;
  width: 78px;
  height: 112px;
  padding: 7px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 22% 17%, rgba(255,255,255,.76), transparent 18%),
    linear-gradient(145deg, #fffdf0, #fff0c9);
  border: 2px solid rgba(139, 91, 50, .23);
  box-shadow: 0 9px 0 rgba(123, 82, 43, .16), 0 13px 18px rgba(65, 71, 39, .18), inset 0 1px 0 rgba(255,255,255,.92);
  color: #4f3929;
  font-family: Georgia, "Times New Roman", "Microsoft YaHei", serif;
  transform-origin: bottom center;
  transform: rotate(var(--rot, 0deg));
  transition: transform .15s ease, filter .15s ease, box-shadow .15s ease;
  cursor: pointer;

  &.red { color: #d84d5d; }
  &.black { color: #4f3929; }

  &.small {
    position: static;
    width: 48px;
    height: 68px;
    padding: 4px;
    cursor: default;
    transform: none;
  }

  &.selected {
    transform: translateY(-30px) rotate(var(--rot, 0deg)) scale(1.04);
    box-shadow: 0 0 0 4px rgba(255, 226, 113, .96), 0 10px 0 rgba(123, 82, 43, .18), 0 18px 30px rgba(64, 70, 38, .24);
    z-index: 70;
  }

  &.illegal {
    filter: grayscale(.62) brightness(.82) opacity(.78);
  }

  &.just-received {
    box-shadow: 0 0 0 4px rgba(107, 206, 112, .96), 0 10px 0 rgba(123, 82, 43, .18), 0 18px 30px rgba(64, 70, 38, .24);
  }
}

.card-corner {
  position: relative;
  z-index: 2;
  font-size: 17px;
  line-height: 16px;
  font-weight: 900;

  &.bottom {
    position: absolute;
    right: 7px;
    bottom: 7px;
    transform: rotate(180deg);
  }
}

.card-pip {
  position: absolute;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
  font-size: 42px;
  line-height: 1;
  opacity: .95;
  text-shadow: 0 1px 0 rgba(255,255,255,.6);
}

.small .card-corner { font-size: 10px; line-height: 9px; }
.small .card-corner.bottom { right: 4px; bottom: 4px; }
.small .card-pip { font-size: 23px; }
</style>
