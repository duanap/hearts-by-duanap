<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card round-table-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">牌桌全览</h2>
        <p class="modal-subtitle">第 {{ game.roundNo }} 局 · {{ passName }}</p>
        <div class="round-table-wrap">
          <table class="round-table-view" v-if="roundTable">
            <thead>
              <tr>
                <th>玩家</th>
                <th>本局</th>
                <th>总分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in roundTable.players" :key="p.index">
                <td>
                  <div class="round-player-cell">
                    <span>{{ p.avatar }}</span>
                    <span>{{ p.name }}</span>
                    <span v-if="p.passedTo" class="round-passed-to">→ {{ p.passedTo }}</span>
                  </div>
                </td>
                <td>{{ p.round }}</td>
                <td>{{ p.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button class="action-btn secondary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { PASS_NAMES } from '../types'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const game = useGameStore()
const roundTable = computed(() => game.roundTable)
const passName = computed(() => PASS_NAMES[game.passMode] || '不传牌')
</script>

<style lang="scss" scoped>
.modal { position: fixed; inset: 0; z-index: 999; }
.modal.hidden { display: none; }
.modal-mask { position: absolute; inset: 0; background: rgba(70, 98, 55, .38); backdrop-filter: blur(8px); }
.modal-card {
  position: absolute; left: 50%; top: 50%; width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 46px); overflow: hidden; padding-top: 20px !important;
  transform: translate(-50%, -50%); padding: 20px 24px 22px; border-radius: 34px;
  color: var(--ink); text-align: center;
  background: linear-gradient(145deg, rgba(255, 251, 235, .99), rgba(244, 219, 168, .98));
  border: 3px solid rgba(123, 82, 43, .2);
  box-shadow: 0 18px 0 rgba(123, 82, 43, .18), 0 28px 55px rgba(57, 70, 39, .26), inset 0 2px 0 rgba(255,255,255,.7);
}
.modal-close {
  position: absolute; right: 16px; top: 14px; width: 34px; height: 34px;
  border: 0; border-radius: 50%; background: linear-gradient(145deg, #fff9df, #f4d79c);
  border: 2px solid rgba(123, 82, 43, .2); color: #ff3434; font-size: 24px; cursor: pointer;
  z-index: 10;
}
.modal-title { margin: 4px 0 8px; color: #6b4529; font-size: 26px; font-weight: 950; padding-right: 36px; }
.modal-subtitle { color: rgba(91, 66, 39, .78); margin-bottom: 14px; padding-right: 36px; }
.round-table-wrap { min-height: 0; overflow: auto; -webkit-overflow-scrolling: touch; }
.round-table-view {
  width: 100%; border-collapse: collapse; border-radius: 28px; overflow: hidden;
  background: rgba(255,255,255,.45); border: 2px solid rgba(123, 82, 43, .13);
  th, td { padding: 13px 10px; border-bottom: 1px dashed rgba(123, 82, 43, .18); text-align: center; }
  th { color: rgba(91, 66, 39, .64); position: sticky; top: 0; z-index: 8; }
  td:first-child { text-align: left; }
}
.round-player-cell { display: flex; align-items: center; gap: 8px; }
.round-passed-to { color: #6a4527; font-size: 12px; }
.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }
.action-btn {
  border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
  padding: 11px 18px; font-weight: 950; cursor: pointer; font-family: inherit; font-size: 15px;
  color: #172313; background: linear-gradient(145deg, #f5d676, #fff3b1);
  &.secondary { color: var(--white); background: rgba(255,255,255,.12); }
}
</style>
