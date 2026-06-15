import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoomStore = defineStore('room', () => {
  const roomId = ref(localStorage.getItem('hearts-online-room-id') || '')
  const hostId = ref('')
  const isHost = ref(false)
  const phase = ref('offline')
  const connected = ref(false)
  const pendingTakeover = ref(false)

  function setRoomId(id: string) {
    roomId.value = id
    if (id) {
      localStorage.setItem('hearts-online-room-id', id)
    } else {
      localStorage.removeItem('hearts-online-room-id')
    }
  }

  function clearRoom() {
    roomId.value = ''
    hostId.value = ''
    isHost.value = false
    phase.value = 'offline'
    pendingTakeover.value = false
    localStorage.removeItem('hearts-online-room-id')
  }

  function applyServerState(msg: any) {
    roomId.value = msg.roomId || ''
    hostId.value = msg.hostId || ''
    isHost.value = Boolean(msg.isHost)
    phase.value = msg.phase || 'offline'
    if (msg.roomId) {
      localStorage.setItem('hearts-online-room-id', msg.roomId)
    }
  }

  const hasRoom = computed(() => Boolean(roomId.value))

  return {
    roomId, hostId, isHost, phase, connected, pendingTakeover,
    hasRoom, setRoomId, clearRoom, applyServerState
  }
})
