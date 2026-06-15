<template>
  <Teleport to="body">
    <div class="special-event" :class="[levelClass, { hidden: !show }]" v-if="event">
      <div class="special-event-level">{{ levelLabel }}</div>
      <div class="special-event-title">{{ event.title }}</div>
      <div class="special-event-subtitle">{{ event.subtitle }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SpecialEvent } from '../types'

const props = defineProps<{
  show: boolean
  event: SpecialEvent | null
}>()

const levelLabel = computed(() => {
  const labels: Record<string, string> = { minor: '小事件', highlight: '高光', epic: '名场面', legendary: '封神' }
  return labels[props.event?.level || 'minor'] || '事件'
})

const levelClass = computed(() => `type-${props.event?.type || 'event'}`)
</script>

<style lang="scss" scoped>
.special-event {
  position: fixed;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2600;
  min-width: 240px; max-width: min(420px, 86vw);
  padding: 18px 24px; border-radius: 26px;
  text-align: center; pointer-events: none;
  color: #fff8dd;
  background: linear-gradient(145deg, rgba(17, 50, 26, .96), rgba(8, 28, 18, .96));
  border: 2px solid rgba(255, 232, 137, .36);
  box-shadow: 0 18px 48px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.10);
  backdrop-filter: blur(14px);
}
.special-event.hidden { display: none; }

.special-event-level {
  display: inline-block; padding: 3px 12px; border-radius: 999px;
  background: rgba(255, 232, 137, .18); color: #ffe68f;
  font-size: 12px; font-weight: 950; margin-bottom: 8px;
}

.special-event-title {
  font-size: 22px; font-weight: 950; margin-bottom: 6px;
  color: #fff8dd; text-shadow: 0 2px 4px rgba(0,0,0,.3);
}

.special-event-subtitle {
  font-size: 14px; color: rgba(255, 249, 224, .78); line-height: 1.5;
}

.type-hearts-broken { color: #fff1f1; background: radial-gradient(circle at 50% 20%, rgba(255,255,255,.20), transparent 28%), linear-gradient(145deg, rgba(114, 11, 24, .96), rgba(220, 38, 38, .84)); border-color: rgba(255, 155, 155, .62); }
.type-shoot-moon { filter: grayscale(.82) brightness(.92); }
</style>
