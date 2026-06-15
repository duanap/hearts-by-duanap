<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-subtitle">{{ subtitle }}</p>
        <table class="score-table">
          <thead>
            <tr>
              <th>玩家</th>
              <th>本局</th>
              <th>总分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in ranked" :key="i" :class="{ 'winner-row': item.isWinner }">
              <td>{{ item.player.avatar }} {{ item.player.name }}</td>
              <td><strong>{{ item.player.round }}</strong></td>
              <td><strong>{{ item.player.total }}</strong></td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <button v-if="room.isHost && game.gameOver" class="action-btn" @click="$emit('restartGame')">再来一局</button>
          <button class="action-btn secondary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useRoomStore } from '../stores/room'

defineProps<{ show: boolean }>()
defineEmits<{ close: []; restartGame: [] }>()

const game = useGameStore()
const room = useRoomStore()

const title = computed(() => {
  const minScore = Math.min(...game.players.map(p => p.total || 0))
  const winners = game.players.filter(p => (p.total || 0) === minScore).map(p => p.name).join('、')
  return `${winners} 获胜！`
})

const subtitle = computed(() => '本局战绩已结算，低分玩家获胜。')

const ranked = computed(() => {
  return game.players
    .map((player, index) => ({ player, index, total: Number(player.total || 0), round: Number(player.round || 0) }))
    .sort((a, b) => a.total - b.total || a.round - b.round || a.index - b.index)
    .map((item, rankIndex) => ({ ...item, isWinner: rankIndex === 0 }))
})
</script>

<style lang="scss" scoped>
.modal { position: fixed; inset: 0; z-index: 999; }
.modal.hidden { display: none; }
.modal-mask { position: absolute; inset: 0; background: rgba(70, 98, 55, .38); backdrop-filter: blur(8px); }
.modal-card {
  position: absolute; left: 50%; top: 50%; width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 46px); overflow: auto;
  transform: translate(-50%, -50%); padding: 26px 24px 22px; border-radius: 34px;
  color: var(--ink); text-align: center;
  background: linear-gradient(145deg, rgba(255, 251, 235, .99), rgba(244, 219, 168, .98));
  border: 3px solid rgba(123, 82, 43, .2);
  box-shadow: 0 18px 0 rgba(123, 82, 43, .18), 0 28px 55px rgba(57, 70, 39, .26), inset 0 2px 0 rgba(255,255,255,.7);
}
.modal-close {
  position: absolute; right: 16px; top: 14px; width: 34px; height: 34px;
  border: 0; border-radius: 50%; background: linear-gradient(145deg, #fff9df, #f4d79c);
  border: 2px solid rgba(123, 82, 43, .2); color: #ff3434; font-size: 24px; cursor: pointer;
}
.modal-title { margin: 4px 0 8px; color: #6b4529; font-size: 26px; font-weight: 950; }
.modal-subtitle { color: rgba(91, 66, 39, .78); margin-bottom: 14px; }

.score-table {
  width: 100%; border-collapse: collapse; border-radius: 28px; overflow: hidden;
  background: rgba(255,255,255,.45);
  th, td { padding: 13px 10px; border-bottom: 1px dashed rgba(123, 82, 43, .18); text-align: center; }
  th:first-child, td:first-child { text-align: left; }
  th { color: rgba(91, 66, 39, .64); }
  strong { color: #6a4527; font-size: 18px; }
}
.winner-row { background: rgba(139, 211, 110, .26); }

.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }
.action-btn {
  border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
  padding: 11px 18px; font-weight: 950; cursor: pointer; font-family: inherit; font-size: 15px;
  color: #172313; background: linear-gradient(145deg, #f5d676, #fff3b1);
  &.secondary { color: var(--white); background: rgba(255,255,255,.12); }
}
</style>
