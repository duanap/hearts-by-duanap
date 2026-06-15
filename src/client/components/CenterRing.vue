<template>
  <section class="center-ring">
    <div class="center-turn-arc hidden" id="turnArc" aria-hidden="true"></div>
    <div class="round-title">{{ title }}</div>
    <div class="round-desc">{{ message }}</div>
    <button class="center-btn" v-show="showCenterBtn" :disabled="centerBtnDisabled" @click="$emit('centerAction')">
      {{ centerBtnText }}
    </button>
    <div class="pass-counter" v-if="passCounter">{{ passCounter }}</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useRoomStore } from '../stores/room'
import { PASS_HINTS } from '../types'

defineEmits<{
  centerAction: []
}>()

const game = useGameStore()
const room = useRoomStore()

const title = computed(() => room.roomId ? `第${game.roundNo}局` : '联机大厅')

const message = computed(() => {
  if (!room.connected) return '正在连接联机服务端……'
  if (!room.roomId || game.phase === 'offline') return '创建房间或输入房间号加入。'
  if (game.phase === 'lobby') return `房间 ${room.roomId}，等待玩家加入。`
  if (game.phase === 'deal') return '正在发牌……'
  if (game.phase === 'pass') {
    return game.youPassed ? '你已完成传牌，等待其他玩家。' : PASS_HINTS[game.passMode]
  }
  if (game.phase === 'play') {
    if (game.comparingTrick) return '正在比牌收墩……'
    if (game.isYourTurn) return `轮到你出牌。${game.heartsBroken ? '红桃已破。' : '红桃尚未破。'}`
    return `等待 ${game.players[game.currentPlayer]?.name || '其他玩家'} 出牌……`
  }
  if (game.phase === 'roundEnd') return '本局结束，点击开始下一局继续。'
  if (game.phase === 'gameEnd') return '游戏结束，点击查看成绩。'
  return '等待联机状态同步……'
})

const showCenterBtn = computed(() => {
  if (game.phase === 'deal' || game.phase === 'play') return false
  if (!room.connected) return false
  return true
})

const centerBtnText = computed(() => {
  if (game.phase === 'pass') return game.passSending ? '传递中' : (game.youPassed ? '等待中' : '传递')
  if (game.phase === 'roundEnd') return '开始下一局'
  if (game.phase === 'gameEnd') return '成绩'
  return '房间'
})

const centerBtnDisabled = computed(() => {
  if (game.phase === 'pass') return game.passSending || game.youPassed || game.selectedPass.size !== 3
  return false
})

const passCounter = computed(() => {
  if (game.phase !== 'pass') return ''
  if (game.passSending) return '传牌中'
  if (game.youPassed) return '已传牌'
  return `已选择 ${game.selectedPass.size}/3 张`
})
</script>

<style lang="scss" scoped>
.center-ring {
  position: absolute;
  overflow: visible;
  left: 50%;
  top: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 34% 38% 33% 40% / 42% 35% 40% 34%;
  border: 3px solid rgba(130, 84, 40, .24);
  background:
    radial-gradient(circle at 26% 18%, rgba(255,255,255,.36), transparent 22%),
    repeating-linear-gradient(90deg, rgba(123, 82, 43, .10) 0 10px, transparent 10px 22px),
    linear-gradient(145deg, rgba(255, 244, 196, .95), rgba(226, 178, 97, .94));
  box-shadow: 0 14px 0 rgba(126, 84, 45, .22), 0 24px 40px rgba(66, 73, 37, .18), inset 0 2px 0 rgba(255,255,255,.64);
  text-align: center;
}

.round-title {
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
  font-size: 25px;
  font-weight: 950;
  color: #6b4529;
  text-shadow: 0 2px 0 rgba(255,255,255,.72);
}

.round-desc {
  position: relative;
  z-index: 1;
  width: 210px;
  min-height: 48px;
  color: rgba(91, 66, 39, .78);
  font-size: 15px;
  line-height: 1.55;
  margin-bottom: 16px;
}

.center-btn {
  position: relative;
  z-index: 2;
  min-width: 92px;
  border: 2px solid rgba(255,255,255,.62);
  border-radius: 999px 999px 999px 22px;
  padding: 11px 20px;
  color: #fffdf0;
  background: linear-gradient(145deg, #79cd63, #3e9f55);
  box-shadow: 0 7px 0 rgba(51, 116, 58, .42), 0 10px 18px rgba(64, 74, 42, .18), inset 0 2px 0 rgba(255,255,255,.46);
  font-size: 17px;
  font-weight: 950;
  cursor: pointer;
  font-family: inherit;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: .55;
    filter: grayscale(.15);
    cursor: not-allowed;
  }
}

.pass-counter {
  position: relative;
  z-index: 2;
  margin-top: 9px;
  color: #2f8a4a;
  font-size: 13px;
  font-weight: 900;
}
</style>
