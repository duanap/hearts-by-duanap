<template>
  <section class="seat" :class="[positionClass, { 'is-turn': isTurn }]">
    <div class="turn-indicator" v-if="isTurn">
      <span class="turn-dot"></span>
    </div>
    <div class="avatar" :class="player.avatarClass">
      <span v-if="player.isBot" class="bot-avatar" :class="botClass">{{ player.avatar }}</span>
      <span v-else class="human-avatar">{{ player.avatar }}</span>
    </div>
    <div class="seat-name">
      {{ player.name }}
      <span v-if="player.isBot && player.aiControlled" class="seat-state bot managed">AI</span>
      <span v-else-if="player.isBot" class="seat-state bot" :class="botClass">AI</span>
    </div>
    <div class="score-box">
      <div class="score-item">
        <div class="score-label">当前</div>
        <div class="score-value">{{ player.round }}</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-item">
        <div class="score-label">总分</div>
        <div class="score-value">{{ player.total }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '../types'

const props = defineProps<{
  player: Player
  position: 'north' | 'west' | 'east' | 'south'
  isTurn?: boolean
}>()

const positionClass = computed(() => props.position)
const botClass = computed(() => {
  if (!props.player.isBot) return ''
  const av = props.player.avatar
  if (av === '魏') return 'bot-wei'
  if (av === '蜀') return 'bot-shu'
  if (av === '吴') return 'bot-wu'
  return ''
})
</script>

<style lang="scss" scoped>
.seat {
  position: absolute;
  z-index: 16;
  text-align: center;
  transform-origin: center center;
}

.seat.north {
  left: 50%;
  top: 10px;
  min-width: 88px;
  transform: translateX(-50%);

  .score-box {
    position: absolute;
    left: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);
  }
}

.seat.west {
  left: 24px;
  top: 43%;
  transform: translateY(-50%);
}

.seat.east {
  right: 24px;
  top: 43%;
  transform: translateY(-50%);
}

.seat.south {
  right: 9.5%;
  bottom: 14px;
}

.avatar {
  position: relative;
  width: 58px;
  height: 58px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 4px solid rgba(255, 250, 222, .85);
  box-shadow: 0 8px 0 rgba(114, 81, 45, .24), 0 14px 22px rgba(67, 82, 39, .22), inset 0 2px 0 rgba(255,255,255,.74);
  background: linear-gradient(145deg, #fff5c7, #f4c978);
}

.avatar.you { background: linear-gradient(145deg, #fff8c9, #8ed3ff); }
.avatar.west { background: linear-gradient(145deg, #fff1bd, #ffb6c8); }
.avatar.north { background: linear-gradient(145deg, #fff0bd, #a9df78); }
.avatar.east { background: linear-gradient(145deg, #fff0bd, #9bd0ff); }

.bot-avatar {
  color: #fffaf3;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: .5px;

  &.bot-wei {
    background: linear-gradient(145deg, #7dbdff, #3b79f0);
    border-color: rgba(221, 239, 255, .92);
  }
  &.bot-shu {
    background: linear-gradient(145deg, #7de0a3, #37a95d);
    border-color: rgba(226, 255, 235, .92);
  }
  &.bot-wu {
    background: linear-gradient(145deg, #ffd089, #e48a31);
    border-color: rgba(255, 240, 214, .92);
  }
}

.human-avatar { font-size: 34px; }

.seat-name {
  margin-top: 6px;
  color: #fff8ca;
  font-size: 15px;
  font-weight: 900;
  text-shadow: 0 2px 0 rgba(82, 54, 30, .55), 0 3px 8px rgba(58, 85, 40, .35);
  white-space: nowrap;
  text-align: center;
  letter-spacing: .6px;
}

.seat-state.bot {
  font-weight: 900;
  &.bot-wei { color: #4a96ff; }
  &.bot-shu { color: #2faa58; }
  &.bot-wu { color: #d8882f; }
  &.managed { color: #df5c5c; }
}

.score-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 24px;
  background: rgba(255, 249, 230, .94);
  border: 2px solid rgba(129, 92, 52, .18);
  box-shadow: 0 16px 30px rgba(76, 100, 54, .18);
  color: var(--ink);
}

.score-item {
  min-width: 36px;
  display: grid;
  gap: 2px;
}

.score-label {
  color: #2f8a4a;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.score-value {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  color: #6a4527;
  text-shadow: 0 1px 0 rgba(255,255,255,.75);
}

.score-divider {
  width: 1px;
  height: 24px;
  background: rgba(123, 82, 43, .26);
}

.is-turn .seat-name { color: #fff4cf; }
.is-turn .avatar {
  transform: translateY(-2px) scale(1.06);
  box-shadow: 0 0 0 5px rgba(255, 251, 195, .18), 0 0 0 10px rgba(255, 244, 179, .12), 0 16px 30px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.4);
}

.turn-indicator {
  position: absolute;
  left: 50%;
  top: -34px;
  transform: translateX(-50%);
  z-index: 16;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  color: #5a422e;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(0,0,0,.18);
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -7px;
    transform: translateX(-50%);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 8px solid rgba(255,255,255,.92);
  }
}

.turn-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #57bf61;
  box-shadow: 0 0 0 4px rgba(87,191,97,.18);
  animation: turnDotBlink .95s ease-in-out infinite;
}

@keyframes turnDotBlink {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(.82); opacity: .55; }
}
</style>
