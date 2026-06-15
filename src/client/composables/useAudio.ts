import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

let audioContext: AudioContext | null = null

export function useAudio() {
  const settings = useSettingsStore()
  const bgmEnabled = ref(false)
  const bgmVolume = ref(0.35)

  function getContext(): AudioContext | null {
    if (!settings.soundEnabled) return null
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return null
      audioContext = audioContext || new AC()
      if (audioContext.state === 'suspended') audioContext.resume()
      return audioContext
    } catch {
      return null
    }
  }

  function playTone(freq = 520, duration = 0.08, type: OscillatorType = 'sine', gainValue = 0.035) {
    const ctx = getContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, Math.min(1, gainValue * settings.soundVolume * 2)),
        ctx.currentTime + 0.012
      )
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration + 0.02)
    } catch { /* ignore */ }
  }

  function playGameSound(kind: string) {
    if (!settings.soundEnabled) return
    switch (kind) {
      case 'play':
        playTone(560, 0.075, 'triangle', 0.035)
        break
      case 'pass':
        playTone(430, 0.07, 'sine', 0.026)
        setTimeout(() => playTone(620, 0.08, 'sine', 0.026), 75)
        break
      case 'moon':
        playTone(523, 0.14, 'sine', 0.04)
        setTimeout(() => playTone(659, 0.14, 'sine', 0.04), 150)
        setTimeout(() => playTone(784, 0.22, 'sine', 0.04), 310)
        break
      case 'error':
        playTone(220, 0.12, 'sawtooth', 0.02)
        break
      case 'turn':
        playTone(760, 0.08, 'sine', 0.025)
        setTimeout(() => playTone(980, 0.09, 'sine', 0.022), 90)
        break
    }
  }

  function playInteractionSound(kind: string) {
    if (!settings.soundEnabled || !settings.interactionSoundEnabled) return
    switch (kind) {
      case 'flower':
        playTone(660, 0.07, 'sine', 0.024)
        setTimeout(() => playTone(880, 0.09, 'sine', 0.022), 70)
        break
      case 'tomato':
        playTone(180, 0.08, 'triangle', 0.030)
        setTimeout(() => playTone(120, 0.08, 'sawtooth', 0.018), 75)
        break
      case 'applause':
        playTone(520, 0.045, 'triangle', 0.020)
        setTimeout(() => playTone(560, 0.045, 'triangle', 0.018), 70)
        break
      default:
        playTone(720, 0.06, 'sine', 0.018)
    }
  }

  return {
    playTone,
    playGameSound,
    playInteractionSound,
    bgmEnabled,
    bgmVolume
  }
}
