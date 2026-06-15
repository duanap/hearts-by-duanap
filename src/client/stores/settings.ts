import { defineStore } from 'pinia'
import { ref } from 'vue'

function loadBool(key: string, defaultVal: boolean): boolean {
  const v = localStorage.getItem(key)
  return v === null ? defaultVal : v !== '0'
}

function loadNumber(key: string, defaultVal: number, min: number, max: number): number {
  const v = Number(localStorage.getItem(key) || defaultVal)
  return Math.max(min, Math.min(max, v))
}

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = ref(loadBool('hearts-online-sound', true))
  const soundVolume = ref(loadNumber('hearts-online-sound-volume', 1, 0, 1))
  const effectsEnabled = ref(loadBool('hearts-online-effects', true))
  const effectSpeed = ref(loadNumber('hearts-online-effect-speed', 1, 0.7, 1.4))
  const interactionEffectsEnabled = ref(loadBool('hearts-online-interaction-effects', true))
  const interactionSoundEnabled = ref(loadBool('hearts-online-interaction-sound', true))
  const allowTomato = ref(loadBool('hearts-online-allow-tomato', true))
  const forceLandscape = ref(localStorage.getItem('hearts-online-force-landscape') === '1')

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('hearts-online-sound', soundEnabled.value ? '1' : '0')
  }

  function toggleEffects() {
    effectsEnabled.value = !effectsEnabled.value
    localStorage.setItem('hearts-online-effects', effectsEnabled.value ? '1' : '0')
  }

  function toggleInteractionEffects() {
    interactionEffectsEnabled.value = !interactionEffectsEnabled.value
    localStorage.setItem('hearts-online-interaction-effects', interactionEffectsEnabled.value ? '1' : '0')
  }

  function toggleInteractionSound() {
    interactionSoundEnabled.value = !interactionSoundEnabled.value
    localStorage.setItem('hearts-online-interaction-sound', interactionSoundEnabled.value ? '1' : '0')
  }

  function toggleAllowTomato() {
    allowTomato.value = !allowTomato.value
    localStorage.setItem('hearts-online-allow-tomato', allowTomato.value ? '1' : '0')
  }

  function setSoundVolume(v: number) {
    soundVolume.value = Math.max(0, Math.min(1, v))
    localStorage.setItem('hearts-online-sound-volume', String(soundVolume.value))
  }

  function setEffectSpeed(v: number) {
    effectSpeed.value = Math.max(0.7, Math.min(1.4, v))
    localStorage.setItem('hearts-online-effect-speed', String(effectSpeed.value))
  }

  function toggleForceLandscape() {
    forceLandscape.value = !forceLandscape.value
    localStorage.setItem('hearts-online-force-landscape', forceLandscape.value ? '1' : '0')
  }

  return {
    soundEnabled, soundVolume, effectsEnabled, effectSpeed,
    interactionEffectsEnabled, interactionSoundEnabled, allowTomato, forceLandscape,
    toggleSound, toggleEffects, toggleInteractionEffects, toggleInteractionSound,
    toggleAllowTomato, setSoundVolume, setEffectSpeed, toggleForceLandscape
  }
})
