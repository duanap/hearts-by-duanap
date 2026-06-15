<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card interaction-panel-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">牌桌互动</h2>
        <p class="modal-subtitle">选择目标后发送表情、送花或扔番茄。互动有冷却限制，避免刷屏。</p>

        <div class="interaction-target-strip">
          <span class="interaction-target-label">当前目标</span>
          <button v-for="(p, i) in game.players" :key="i" class="interaction-target-chip"
            :class="{ 'is-active': interaction.target.value === i }"
            @click="interaction.target.value = i">
            {{ p.name }}
          </button>
        </div>

        <div class="interaction-section-title">快捷表情</div>
        <div class="interaction-grid">
          <button v-for="(item, index) in interaction.EMOJIS" :key="index" class="interaction-option"
            :disabled="interaction.cooldownRemaining(item.kind) > 0"
            @click="interaction.sendEmoji(item, sendToWs)">
            <span class="interaction-icon">{{ item.icon }}</span>
            <span>{{ interaction.cooldownRemaining(item.kind) ? `${item.label} ${interaction.cooldownRemaining(item.kind)}s` : item.label }}</span>
          </button>
        </div>

        <div class="interaction-section-title">道具互动</div>
        <div class="interaction-grid">
          <button v-for="(item, index) in interaction.TOOLS" :key="index" class="interaction-option" :class="item.className"
            :disabled="interaction.cooldownRemaining(item.kind) > 0 || (item.kind === 'tomato' && !settings.allowTomato)"
            @click="interaction.sendTool(item, sendToWs)">
            <span class="interaction-icon">{{ item.icon }}</span>
            <span>{{ getToolLabel(item) }}</span>
          </button>
        </div>

        <div class="interaction-cooldown-note">普通表情 / 点赞 1 秒冷却，送花 / 扔番茄 1.8 秒冷却，鼓掌 2.2 秒冷却。</div>

        <div class="modal-actions">
          <button class="action-btn secondary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { useGameStore } from '../stores/game'
import { useSettingsStore } from '../stores/settings'
import { useInteraction } from '../composables/useInteraction'
import type { ClientMessage } from '../types'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const game = useGameStore()
const settings = useSettingsStore()
const interaction = useInteraction()
const sendFn = inject<(data: ClientMessage) => boolean>('wsSend', () => false)

function sendToWs(data: ClientMessage) {
  return sendFn(data)
}

function getToolLabel(item: { kind: string; label: string }) {
  const cd = interaction.cooldownRemaining(item.kind)
  if (item.kind === 'tomato' && !settings.allowTomato) return '番茄已关'
  if (cd) return `${item.label} ${cd}s`
  return item.label
}
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

.interaction-target-strip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 12px 0 14px; }
.interaction-target-label { color: rgba(89,61,35,.74); font-size: 13px; font-weight: 900; }
.interaction-target-chip {
  border: 1px solid rgba(111, 74, 34, .18); border-radius: 999px;
  padding: 6px 10px; color: #5b3b21; background: rgba(255,248,222,.56);
  font-weight: 900; cursor: pointer; font-family: inherit;
  &.is-on, &.is-active { color: #fffaf0; border-color: rgba(255,255,255,.38); background: linear-gradient(145deg, #6da552, #477e39); }
}

.interaction-section-title { margin: 14px 0 8px; color: #5b3b21; font-weight: 950; font-size: 14px; }
.interaction-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.interaction-option {
  min-height: 46px; border: 1px solid rgba(111,74,34,.16); border-radius: 16px;
  color: #51351f; background: rgba(255,249,225,.64);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.52); font-weight: 950; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit;
  &:hover { filter: brightness(1.04); }
  &:disabled { opacity: .45; cursor: not-allowed; }
}
.interaction-icon { font-size: 19px; line-height: 1; }

.interaction-cooldown-note {
  margin-top: 12px; padding: 8px; border-radius: 12px;
  background: rgba(255,255,255,.28); font-size: 12px; color: rgba(91, 66, 39, .78); font-weight: 900;
}

.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }
.action-btn {
  border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
  padding: 11px 18px; font-weight: 950; cursor: pointer; font-family: inherit; font-size: 15px;
  color: #172313; background: linear-gradient(145deg, #f5d676, #fff3b1);
  &.secondary { color: var(--white); background: rgba(255,255,255,.12); }
}
</style>
