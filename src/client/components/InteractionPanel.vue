<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card interaction-panel-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">牌桌互动</h2>
        <p class="modal-subtitle">选择目标后发送表情、送花或扔番茄。</p>

        <div class="interaction-target-strip">
          <span class="interaction-target-label">当前目标</span>
          <button v-for="i in 4" :key="i" class="interaction-target-chip"
            :class="{ 'is-active': target === i - 1 }"
            @click="target = i - 1">
            {{ targetName(i - 1) }}
          </button>
        </div>

        <div class="interaction-section-title">快捷表情</div>
        <div class="interaction-grid">
          <button v-for="(item, index) in emojis" :key="index" class="interaction-option"
            @click="sendEmoji(item)">
            <span class="interaction-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="interaction-section-title">道具互动</div>
        <div class="interaction-grid">
          <button v-for="(item, index) in tools" :key="index" class="interaction-option" :class="item.className"
            @click="sendTool(item)">
            <span class="interaction-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="modal-actions">
          <button class="action-btn secondary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const game = useGameStore()
const target = ref(0)

const EMOJIS = [
  { kind: 'emoji', icon: '👍', label: '干得漂亮' },
  { kind: 'emoji', icon: '😂', label: '哈哈哈' },
  { kind: 'emoji', icon: '⚡', label: '搞快点！' },
  { kind: 'emoji', icon: '🛸', label: '小飞棍来喽~' },
  { kind: 'emoji', icon: '🚨', label: '拦住他' },
  { kind: 'emoji', icon: '🌕', label: '冲月亮' },
  { kind: 'emoji', icon: '😭', label: '家人们谁懂啊' },
  { kind: 'emoji', icon: '🔍', label: '验牌' },
  { kind: 'emoji', icon: '😏', label: '小瘪三' },
]

const TOOLS = [
  { kind: 'flower', icon: '🌹', label: '送花', className: 'tool-flower' },
  { kind: 'tomato', icon: '🍅', label: '扔番茄', className: 'tool-tomato' },
  { kind: 'brick', icon: '🧱', label: '扔砖头', className: 'tool-brick' },
  { kind: 'slipper', icon: '👟', label: '扔拖鞋', className: 'tool-slipper' },
  { kind: 'cabbage', icon: '🥬', label: '扔白菜', className: 'tool-cabbage' },
  { kind: 'like', icon: '❤️', label: '点赞', className: 'tool-like' },
  { kind: 'applause', icon: '👏', label: '鼓掌', className: 'tool-applause' },
]

const emojis = EMOJIS
const tools = TOOLS

function targetName(i: number) {
  const names = ['自己', '上家', '对家', '下家']
  return game.players[i]?.name || names[i]
}

function sendEmoji(item: typeof EMOJIS[0]) {
  // Will connect to WebSocket composable
}

function sendTool(item: typeof TOOLS[0]) {
  // Will connect to WebSocket composable
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
}
.interaction-icon { font-size: 19px; line-height: 1; }

.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }
.action-btn {
  border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
  padding: 11px 18px; font-weight: 950; cursor: pointer; font-family: inherit; font-size: 15px;
  color: #172313; background: linear-gradient(145deg, #f5d676, #fff3b1);
  &.secondary { color: var(--white); background: rgba(255,255,255,.12); }
}
</style>
