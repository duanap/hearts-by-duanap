import { ref, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useRoomStore } from '../stores/room'
import type { ServerMessage, ClientMessage } from '../types'

export function useWebSocket() {
  const game = useGameStore()
  const room = useRoomStore()

  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let helloTimer: ReturnType<typeof setTimeout> | null = null
  let wsConnecting = false
  let wsFailCount = 0
  const clientId = ensureClientId()

  const connected = ref(false)
  const lastError = ref('')

  function ensureClientId(): string {
    let id = localStorage.getItem('hearts-online-client-id')
    if (!id) {
      id = 'client-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('hearts-online-client-id', id)
    }
    return id
  }

  function send(data: ClientMessage) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      lastError.value = '连接已断开，正在重连……'
      connect()
      return false
    }
    socket.send(JSON.stringify({ ...data, clientId }))
    return true
  }

  function fallbackToLobby(reason: string) {
    connected.value = false
    room.clearRoom()
    game.reset()
    lastError.value = reason
  }

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return
    if (wsConnecting) return
    wsConnecting = true

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    socket = new WebSocket(`${protocol}://${location.host}/ws`)

    socket.addEventListener('open', () => {
      connected.value = true
      wsFailCount = 0
      wsConnecting = false
      lastError.value = ''
      send({ type: 'hello', roomId: room.roomId })

      clearTimeout(helloTimer!)
      helloTimer = setTimeout(() => {
        if (game.phase === 'offline' && room.roomId) {
          fallbackToLobby('连接超时，房间信息已重置。')
        }
      }, 5000)
    })

    socket.addEventListener('message', (event) => {
      let msg: ServerMessage
      try { msg = JSON.parse(event.data) } catch { return }

      clearTimeout(helloTimer!)

      if (msg.type === 'state') {
        room.applyServerState(msg)
        game.applyServerState(msg)
      } else if (msg.type === 'roomCreated') {
        room.setRoomId(msg.roomId)
        lastError.value = `房间创建成功：${msg.roomId}`
      } else if (msg.type === 'roomClosed') {
        fallbackToLobby(msg.message || '房间已解散。')
      } else if (msg.type === 'leftRoom') {
        room.clearRoom()
        game.reset()
        lastError.value = msg.message || '已退出房间。'
      } else if (msg.type === 'error') {
        lastError.value = msg.message || '操作失败'
      } else if (msg.type === 'takeoverRequested') {
        room.pendingTakeover = true
        lastError.value = `已请求接管 AI「${msg.botName}」，等待房主批准……`
      } else if (msg.type === 'takeoverRejected') {
        room.pendingTakeover = false
        lastError.value = msg.message || '房主拒绝了你的接管请求'
      } else if (msg.type === 'takeoverApprovalNeeded') {
        room.pendingTakeover = false
      }
    })

    socket.addEventListener('close', () => {
      connected.value = false
      wsConnecting = false
      clearTimeout(helloTimer!)
      wsFailCount += 1

      if (wsFailCount >= 2 && room.roomId) {
        fallbackToLobby('无法连接服务端，房间信息已重置。')
      }

      clearTimeout(reconnectTimer!)
      reconnectTimer = setTimeout(connect, Math.min(1200 * wsFailCount, 8000))
    })

    socket.addEventListener('error', () => {
      connected.value = false
    })
  }

  function disconnect() {
    clearTimeout(reconnectTimer!)
    clearTimeout(helloTimer!)
    if (socket) {
      socket.close()
      socket = null
    }
    wsConnecting = false
  }

  // ── 生命周期 ──
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !connected.value) {
      connect()
    }
  })

  window.addEventListener('online', () => {
    if (!connected.value) connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    lastError,
    send,
    connect,
    disconnect
  }
}
