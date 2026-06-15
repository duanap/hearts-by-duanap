<template>
  <Teleport to="body">
    <div class="modal" :class="{ hidden: !show }">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-card settings-card">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="modal-title">设置</h2>

        <div class="settings-section">
          <div class="settings-row">
            <span class="settings-row-label">出牌音效</span>
            <button class="settings-switch" :class="{ 'is-on': settings.soundEnabled }" @click="settings.toggleSound()">
              {{ settings.soundEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="settings-row" v-if="settings.soundEnabled">
            <span class="settings-row-label">音量</span>
            <input type="range" min="0" max="100" step="5" :value="Math.round(settings.soundVolume * 100)"
              @input="settings.setSoundVolume(Number(($event.target as HTMLInputElement).value) / 100)" />
            <span class="settings-mini">{{ Math.round(settings.soundVolume * 100) }}%</span>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-row">
            <span class="settings-row-label">牌局特效</span>
            <button class="settings-switch" :class="{ 'is-on': settings.effectsEnabled }" @click="settings.toggleEffects()">
              {{ settings.effectsEnabled ? '开启' : '关闭' }}
            </button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-row">
            <span class="settings-row-label">互动特效</span>
            <button class="settings-switch" :class="{ 'is-on': settings.interactionEffectsEnabled }" @click="settings.toggleInteractionEffects()">
              {{ settings.interactionEffectsEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="settings-row">
            <span class="settings-row-label">互动音效</span>
            <button class="settings-switch" :class="{ 'is-on': settings.interactionSoundEnabled }" @click="settings.toggleInteractionSound()">
              {{ settings.interactionSoundEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="settings-row">
            <span class="settings-row-label">允许扔番茄</span>
            <button class="settings-switch" :class="{ 'is-on': settings.allowTomato }" @click="settings.toggleAllowTomato()">
              {{ settings.allowTomato ? '开启' : '关闭' }}
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="action-btn secondary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'

defineProps<{ show: boolean }>()
defineEmits<{ close: [] }>()

const settings = useSettingsStore()
</script>

<style lang="scss" scoped>
.modal { position: fixed; inset: 0; z-index: 999; }
.modal.hidden { display: none; }
.modal-mask { position: absolute; inset: 0; background: rgba(70, 98, 55, .38); backdrop-filter: blur(8px); }
.modal-card {
  position: absolute;
  left: 50%; top: 50%;
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 46px);
  overflow: auto;
  transform: translate(-50%, -50%);
  padding: 26px 24px 22px;
  border-radius: 34px;
  color: var(--ink);
  text-align: center;
  background: linear-gradient(145deg, rgba(255, 251, 235, .99), rgba(244, 219, 168, .98));
  border: 3px solid rgba(123, 82, 43, .2);
  box-shadow: 0 18px 0 rgba(123, 82, 43, .18), 0 28px 55px rgba(57, 70, 39, .26), inset 0 2px 0 rgba(255,255,255,.7);
}
.modal-close {
  position: absolute; right: 16px; top: 14px;
  width: 34px; height: 34px; border: 0; border-radius: 50%;
  background: linear-gradient(145deg, #fff9df, #f4d79c);
  border: 2px solid rgba(123, 82, 43, .2);
  color: #ff3434; font-size: 24px; cursor: pointer;
}
.modal-title {
  margin: 4px 0 16px; color: #6b4529; font-size: 26px; font-weight: 950;
  text-shadow: 0 2px 0 rgba(255,255,255,.72);
}
.settings-section {
  margin-bottom: 16px; padding: 12px; border-radius: 16px;
  background: rgba(255,255,255,.38);
}
.settings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; gap: 12px;
}
.settings-row-label { font-weight: 900; font-size: 14px; }
.settings-switch {
  padding: 6px 14px; border-radius: 999px; border: 2px solid rgba(123,82,43,.18);
  background: rgba(255,255,255,.52); font-weight: 900; cursor: pointer;
  color: #6b4b2d; font-family: inherit; font-size: 13px;
  &.is-on { background: linear-gradient(135deg, #76c85f, #59a94f); color: #fff; border-color: transparent; }
}
.settings-mini { font-size: 13px; font-weight: 900; color: #6a4527; min-width: 40px; text-align: right; }
.modal-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }
.action-btn {
  border: 1px solid rgba(255,255,255,.18); border-radius: 999px;
  padding: 11px 18px; font-weight: 950; cursor: pointer; font-family: inherit; font-size: 15px;
  color: #172313; background: linear-gradient(145deg, #f5d676, #fff3b1);
  &.secondary { color: var(--white); background: rgba(255,255,255,.12); }
}
</style>
