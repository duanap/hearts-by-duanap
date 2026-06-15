import { ref } from 'vue'

interface Toast {
  id: number
  text: string
  type: 'action' | 'hand' | 'receive'
  visible: boolean
}

let toastId = 0

const toasts = ref<Toast[]>([])

export function useToast() {
  function showActionToast(text: string, duration = 1500) {
    const id = ++toastId
    const toast: Toast = { id, text, type: 'action', visible: true }
    toasts.value.push(toast)
    setTimeout(() => {
      const t = toasts.value.find(t => t.id === id)
      if (t) t.visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }, duration)
  }

  function showHandTip(text: string, duration = 3000) {
    const id = ++toastId
    const toast: Toast = { id, text, type: 'hand', visible: true }
    toasts.value.push(toast)
    setTimeout(() => {
      const t = toasts.value.find(t => t.id === id)
      if (t) t.visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }, duration)
  }

  function showReceiveToast(text: string, duration = 5200) {
    const id = ++toastId
    const toast: Toast = { id, text, type: 'receive', visible: true }
    toasts.value.push(toast)
    setTimeout(() => {
      const t = toasts.value.find(t => t.id === id)
      if (t) t.visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }, duration)
  }

  return {
    toasts,
    showActionToast,
    showHandTip,
    showReceiveToast
  }
}
