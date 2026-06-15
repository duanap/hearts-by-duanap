import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useSettingsStore } from '../stores/settings'
import { useAudio } from './useAudio'

export function useInteraction() {
  const game = useGameStore()
  const settings = useSettingsStore()
  const audio = useAudio()

  const target = ref(0)
  const cooldowns = ref<Record<string, number>>({})

  const EMOJIS = [
    { kind: 'emoji', icon: '👍', label: '干得漂亮', cooldown: 1000 },
    { kind: 'emoji', icon: '😂', label: '哈哈哈', cooldown: 1000 },
    { kind: 'emoji', icon: '⚡', label: '搞快点！', cooldown: 1000 },
    { kind: 'emoji', icon: '🛸', label: '小飞棍来喽~', cooldown: 1000 },
    { kind: 'emoji', icon: '🚨', label: '拦住他', cooldown: 1000 },
    { kind: 'emoji', icon: '🌕', label: '冲月亮', cooldown: 1000 },
    { kind: 'emoji', icon: '😭', label: '家人们谁懂啊', cooldown: 1000 },
    { kind: 'emoji', icon: '🔍', label: '验牌', cooldown: 1000 },
    { kind: 'emoji', icon: '😏', label: '小瘪三', cooldown: 1000 },
  ]

  const TOOLS = [
    { kind: 'flower', icon: '🌹', label: '送花', cooldown: 1800, className: 'tool-flower' },
    { kind: 'tomato', icon: '🍅', label: '扔番茄', cooldown: 1800, className: 'tool-tomato' },
    { kind: 'brick', icon: '🧱', label: '扔砖头', cooldown: 1800, className: 'tool-brick' },
    { kind: 'slipper', icon: '👟', label: '扔拖鞋', cooldown: 1800, className: 'tool-slipper' },
    { kind: 'cabbage', icon: '🥬', label: '扔白菜', cooldown: 1800, className: 'tool-cabbage' },
    { kind: 'like', icon: '❤️', label: '点赞', cooldown: 1000, className: 'tool-like' },
    { kind: 'applause', icon: '👏', label: '鼓掌', cooldown: 2200, className: 'tool-applause' },
  ]

  function cooldownRemaining(kind: string): number {
    const end = cooldowns.value[kind] || 0
    return Math.max(0, Math.ceil((end - Date.now()) / 1000))
  }

  function setCooldown(kind: string, ms: number) {
    cooldowns.value[kind] = Date.now() + ms
  }

  function sendEmoji(item: typeof EMOJIS[0], sendFn: (data: any) => boolean) {
    if (cooldownRemaining(item.kind)) return
    sendFn({
      type: 'interaction',
      interaction: { kind: item.kind, icon: item.icon, label: item.label, toIndex: target.value }
    })
    setCooldown(item.kind, item.cooldown)
    audio.playInteractionSound(item.kind)
  }

  function sendTool(item: typeof TOOLS[0], sendFn: (data: any) => boolean) {
    if (cooldownRemaining(item.kind)) return
    if (item.kind === 'tomato' && !settings.allowTomato) return
    sendFn({
      type: 'interaction',
      interaction: { kind: item.kind, icon: item.icon, label: item.label, toIndex: target.value }
    })
    setCooldown(item.kind, item.cooldown)
    audio.playInteractionSound(item.kind)
  }

  return {
    target, cooldowns, EMOJIS, TOOLS,
    cooldownRemaining, sendEmoji, sendTool
  }
}
