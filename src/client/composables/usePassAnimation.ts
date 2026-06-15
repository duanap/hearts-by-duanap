import { ref } from 'vue'

export interface PassFlight {
  id: string
  fromIndex: number
  toIndex: number
  startX: number
  startY: number
  endX: number
  endY: number
  startTime: number
  duration: number
}

export function usePassAnimation() {
  const flights = ref<PassFlight[]>([])
  const isAnimating = ref(false)

  function getSeatCenter(viewIndex: number): { x: number; y: number } {
    const seat = document.querySelector(`.seat:nth-child(${viewIndex + 1})`)
    if (!seat) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const rect = seat.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }

  function startPassFlight(direction: number, onComplete?: () => void) {
    isAnimating.value = true
    flights.value = []

    const baseTime = Date.now()
    const flightDuration = 1200
    const delayBetween = 120

    for (let i = 0; i < 4; i++) {
      const from = i
      const to = (i + direction) % 4
      const fromCenter = getSeatCenter(from)
      const toCenter = getSeatCenter(to)

      for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
        flights.value.push({
          id: `pass-${i}-${cardIndex}`,
          fromIndex: from,
          toIndex: to,
          startX: fromCenter.x + (cardIndex - 1) * 14,
          startY: fromCenter.y + (cardIndex - 1) * 5,
          endX: toCenter.x + (cardIndex - 1) * 14,
          endY: toCenter.y + (cardIndex - 1) * 5,
          startTime: baseTime + i * delayBetween + cardIndex * 40,
          duration: flightDuration
        })
      }
    }

    setTimeout(() => {
      flights.value = []
      isAnimating.value = false
      onComplete?.()
    }, flightDuration + 4 * delayBetween + 120)
  }

  function startCollectFlight(winnerIndex: number, onComplete?: () => void) {
    isAnimating.value = true
    flights.value = []

    const baseTime = Date.now()
    const target = getSeatCenter(winnerIndex)

    for (let i = 0; i < 4; i++) {
      const center = getSeatCenter(i)
      flights.value.push({
        id: `collect-${i}`,
        fromIndex: i,
        toIndex: winnerIndex,
        startX: center.x,
        startY: center.y,
        endX: target.x + (i - 1.5) * 10,
        endY: target.y + (i - 1.5) * 5,
        startTime: baseTime + i * 80,
        duration: 600
      })
    }

    setTimeout(() => {
      flights.value = []
      isAnimating.value = false
      onComplete?.()
    }, 800 + 4 * 80)
  }

  return {
    flights,
    isAnimating,
    startPassFlight,
    startCollectFlight
  }
}
