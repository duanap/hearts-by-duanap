<template>
  <div class="table-scene" :class="{ dealing: game.phase === 'deal' }">
    <header class="brand">
      <span class="brand-main">Hearts by duanap</span>
      <span class="brand-version">v1.5.0</span>
    </header>
    <div class="top-actions">
      <button class="top-btn" @click="settings.toggleForceLandscape()">横屏</button>
      <button class="top-btn" @click="toggleFullscreen">全屏</button>
      <button class="top-btn" @click="showRoomModal = true">房间</button>
      <button class="top-btn" @click="showSettingsModal = true">设置</button>
    </div>

    <GameTable />

    <button class="interaction-fab" @click="showInteractionPanel = true">💬 互动</button>

    <!-- Connection Notice -->
    <div class="offline-banner" :class="{ hidden: !ws.lastError.value }">
      {{ ws.lastError.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from './stores/game'
import { useRoomStore } from './stores/room'
import { useSettingsStore } from './stores/settings'
import { useWebSocket } from './composables/useWebSocket'
import GameTable from './components/GameTable.vue'

const game = useGameStore()
const room = useRoomStore()
const settings = useSettingsStore()
const ws = useWebSocket()

const showRoomModal = ref(false)
const showSettingsModal = ref(false)
const showInteractionPanel = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

// Auto-connect on mount
ws.connect()
</script>

<style lang="scss">
@use './styles/main.scss';
</style>
