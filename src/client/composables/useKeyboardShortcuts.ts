import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

export function useKeyboardShortcuts(handlers: {
  onPlayCard?: (cardId: string) => void
  onPassCards?: (cardIds: string[]) => void
  onCenterAction?: () => void
  onToggleLastTrick?: () => void
  onToggleRoundTable?: () => void
}) {
  const game = useGameStore()

  function handleKeydown(e: KeyboardEvent) {
    // Space/Enter = center action
    if (e.key === ' ' || e.key === 'Enter') {
      if (!e.target || (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault()
        handlers.onCenterAction?.()
      }
    }

    // L = toggle last trick
    if (e.key === 'l' || e.key === 'L') {
      if (!e.target || (e.target as HTMLElement).tagName !== 'INPUT') {
        handlers.onToggleLastTrick?.()
      }
    }

    // T = toggle round table
    if (e.key === 't' || e.key === 'T') {
      if (!e.target || (e.target as HTMLElement).tagName !== 'INPUT') {
        handlers.onToggleRoundTable?.()
      }
    }

    // 1-9 = select card from hand (by position)
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1
      const hand = game.players[0]?.hand || []
      if (index < hand.length && game.phase === 'play' && game.isYourTurn) {
        const card = hand[index]
        if (game.legalCardIds.has(card.id)) {
          handlers.onPlayCard?.(card.id)
        }
      }
    }

    // Q/W/E/R = quick pass card selection (top 4 cards by suit order)
    if (game.phase === 'pass' && !game.youPassed) {
      const quickKeys: Record<string, number> = { q: 0, w: 1, e: 2, r: 3 }
      const index = quickKeys[e.key.toLowerCase()]
      if (index !== undefined) {
        const hand = game.players[0]?.hand || []
        if (index < hand.length) {
          const card = hand[index]
          if (game.selectedPass.has(card.id)) {
            game.selectedPass.delete(card.id)
          } else if (game.selectedPass.size < 3) {
            game.selectedPass.add(card.id)
          }
        }
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
