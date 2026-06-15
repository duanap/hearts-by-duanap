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

    <GameTable @playCard="onPlayCard" @centerAction="onCenterAction" />

    <button class="interaction-fab" @click="showInteractionPanel = true">💬 互动</button>

    <!-- Connection Notice -->
    <transition name="fade">
      <div class="offline-banner" v-if="ws.lastError.value">{{ ws.lastError.value }}</div>
    </transition>

    <!-- Modals -->
    <RoomModal :show="showRoomModal" :initialMode="roomModalMode" :roomId="room.roomId"
      :players="roomPlayers" :isHost="room.isHost"
      @close="showRoomModal = false"
      @createRoom="onCreateRoom"
      @joinRoom="onJoinRoom"
      @startGame="ws.send({ type: 'startGame' })"
      @fillBots="ws.send({ type: 'fillBotsAndStart' })"
      @leaveRoom="ws.send({ type: 'leaveRoom' })"
      @copyRoomId="copyRoomId" />

    <SettingsModal :show="showSettingsModal" @close="showSettingsModal = false" />
    <InteractionPanel :show="showInteractionPanel" @close="showInteractionPanel = false" />
    <LastTrickPopover :show="showLastTrick" @close="showLastTrick = false" />
    <RoundTable :show="showRoundTable" @close="showRoundTable = false" />
    <SpecialEvent :show="showSpecialEvent" :event="currentSpecialEvent" />
    <ResultModal :show="showResult" @close="showResult = false" @restartGame="ws.send({ type: 'restartGame' })" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from './stores/game'
import { useRoomStore } from './stores/room'
import { useSettingsStore } from './stores/settings'
import { useWebSocket } from './composables/useWebSocket'
import GameTable from './components/GameTable.vue'
import RoomModal from './components/RoomModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import InteractionPanel from './components/InteractionPanel.vue'
import LastTrickPopover from './components/LastTrickPopover.vue'
import RoundTable from './components/RoundTable.vue'
import SpecialEvent from './components/SpecialEvent.vue'
import ResultModal from './components/ResultModal.vue'
import type { SpecialEvent as SpecialEventType } from './types'

const game = useGameStore()
const room = useRoomStore()
const settings = useSettingsStore()
const ws = useWebSocket()

const showRoomModal = ref(false)
const showSettingsModal = ref(false)
const showInteractionPanel = ref(false)
const showLastTrick = ref(false)
const showRoundTable = ref(false)
const showSpecialEvent = ref(false)
const showResult = ref(false)
const currentSpecialEvent = ref<SpecialEventType | null>(null)

const roomModalMode = computed(() => room.hasRoom ? 'status' : 'choice')
const roomPlayers = computed(() => game.players.map(p => ({
  name: p.name, avatar: p.avatar, isBot: p.isBot, connected: p.connected
})))

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function copyRoomId() {
  navigator.clipboard?.writeText(room.roomId)
}

function onCreateRoom(nickname: string) {
  ws.send({ type: 'createRoom', nickname })
}

function onJoinRoom(data: { nickname: string; roomId: string }) {
  ws.send({ type: 'joinRoom', roomId: data.roomId, nickname: data.nickname })
}

function onPlayCard(cardId: string) {
  ws.send({ type: 'playCard', cardId })
}

function onCenterAction() {
  if (game.phase === 'pass') {
    if (game.selectedPass.size === 3) {
      ws.send({ type: 'passCards', cards: [...game.selectedPass] })
    }
  } else if (game.phase === 'roundEnd') {
    ws.send({ type: 'startNextRound' })
  } else if (game.phase === 'gameEnd') {
    showResult.value = true
  } else if (!room.hasRoom) {
    showRoomModal.value = true
  }
}

onMounted(() => {
  ws.connect()
  if (!room.hasRoom) {
    setTimeout(() => { showRoomModal.value = true }, 260)
  }
})
</script>

<style lang="scss">
@use './styles/main.scss';

.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.offline-banner {
  position: fixed; left: 50%; top: 132px; transform: translateX(-50%);
  z-index: 36; max-width: min(720px, calc(100vw - 40px));
  padding: 11px 18px; border-radius: 999px;
  color: #fff8da; background: rgba(126, 42, 38, .90);
  border: 1px solid rgba(255, 245, 214, .40);
  box-shadow: 0 16px 30px rgba(0,0,0,.32);
  font-weight: 950; text-align: center;
  pointer-events: none;
}

.interaction-fab {
  position: fixed;
  left: calc(50% + clamp(126px, 18vw, 190px));
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 248, 221, .82);
  color: #fff8dd;
  background: transparent;
  font-weight: 950;
  font-size: 13px;
  cursor: pointer;
  pointer-events: auto;
  white-space: nowrap;
  font-family: inherit;
}

.top-actions {
  position: absolute; right: 26px; top: 24px; z-index: 30;
  display: flex; gap: 10px;
}

.top-btn {
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 999px 999px 999px 20px;
  padding: 10px 15px;
  color: var(--ink);
  background: linear-gradient(145deg, rgba(255, 248, 217, .96), rgba(240, 207, 142, .92));
  box-shadow: 0 16px 30px rgba(76, 100, 54, .18);
  font-weight: 950;
  cursor: pointer;
  font-family: inherit;
}
</style>
