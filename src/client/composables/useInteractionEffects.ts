import { ref } from 'vue'

interface InteractionEffect {
  id: number
  kind: string
  icon: string
  label: string
  x: number
  y: number
  startTime: number
}

const effects = ref<InteractionEffect[]>([])

export function useInteractionEffects() {
  function showInteractionBubble(icon: string, label: string, x: number, y: number) {
    const id = Date.now() + Math.random()
    effects.value.push({ id, kind: 'bubble', icon, label, x, y, startTime: Date.now() })
    setTimeout(() => {
      effects.value = effects.value.filter(e => e.id !== id)
    }, 2200)
  }

  function showInteractionImpact(kind: string, icon: string, x: number, y: number) {
    const id = Date.now() + Math.random()
    effects.value.push({ id, kind: 'impact', icon, label: '', x, y, startTime: Date.now() })
    setTimeout(() => {
      effects.value = effects.value.filter(e => e.id !== id)
    }, 1500)
  }

  function getSeatPosition(viewIndex: number): { x: number; y: number } {
    const seat = document.querySelector(`.seat:nth-child(${viewIndex + 1})`)
    if (!seat) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const rect = seat.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top - 20 }
  }

  return {
    effects,
    showInteractionBubble,
    showInteractionImpact,
    getSeatPosition
  }
}
