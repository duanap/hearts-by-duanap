import { ref, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'

export function useAudio() {
  const settings = useSettingsStore()
  let audioContext: AudioContext | null = null

  function playTone(freq = 520, duration = 0.08, type: OscillatorType = 'sine', gainValue = 0.035) {
    if (!settings.soundEnabled) return
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      audioContext = audioContext || new AC()
      if (audioContext.state === 'suspended') audioContext.resume()
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, Math.min(1, gainValue * settings.soundVolume * 2)),
        audioContext.currentTime + 0.012
      )
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration)
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.start()
      osc.stop(audioContext.currentTime + duration + 0.02)
    } catch {
      // 浏览器音频权限或设备不支持
    }
  }

  function playGameSound(kind: string) {
    if (!settings.soundEnabled) return
    if (kind === 'play') {
      playTone(560, 0.075, 'triangle', 0.035)
    } else if (kind === 'pass') {
      playTone(430, 0.07, 'sine', 0.026)
      setTimeout(() => playTone(620, 0.08, 'sine', 0.026), 75)
    } else if (kind === 'moon') {
      playTone(523, 0.14, 'sine', 0.04)
      setTimeout(() => playTone(659, 0.14, 'sine', 0.04), 150)
      setTimeout(() => playTone(784, 0.22, 'sine', 0.04), 310)
    } else if (kind === 'error') {
      playTone(220, 0.12, 'sawtooth', 0.02)
    }
  }

  function playInteractionSound(kind: string) {
    if (!settings.soundEnabled || !settings.interactionSoundEnabled) return
    if (kind === 'flower') {
      playTone(660, 0.07, 'sine', 0.024)
      setTimeout(() => playTone(880, 0.09, 'sine', 0.022), 70)
    } else if (kind === 'tomato') {
      playTone(180, 0.08, 'triangle', 0.030)
      setTimeout(() => playTone(120, 0.08, 'sawtooth', 0.018), 75)
    } else if (kind === 'applause') {
      playTone(520, 0.045, 'triangle', 0.020)
      setTimeout(() => playTone(560, 0.045, 'triangle', 0.018), 70)
    } else {
      playTone(720, 0.06, 'sine', 0.018)
    }
  }

  onUnmounted(() => {
    if (audioContext) {
      audioContext.close().catch(() => {})
      audioContext = null
    }
  })

  return { playTone, playGameSound, playInteractionSound }
}
