<template>
  <Teleport to="body">
    <TransitionGroup name="effect">
      <div v-for="effect in effects" :key="effect.id"
        class="interaction-effect" :class="`effect-${effect.kind}`"
        :style="{ left: effect.x + 'px', top: effect.y + 'px' }">
        <span class="effect-icon">{{ effect.icon }}</span>
        <span v-if="effect.label" class="effect-label">{{ effect.label }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useInteractionEffects } from '../composables/useInteractionEffects'
const { effects } = useInteractionEffects()
</script>

<style lang="scss" scoped>
.interaction-effect {
  position: fixed;
  transform: translate(-50%, -50%);
  z-index: 2500;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.effect-bubble {
  animation: bubbleFloat 2.2s ease-out forwards;
}

.effect-impact {
  animation: impactBurst 1.5s ease-out forwards;
}

.effect-icon {
  font-size: 36px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,.3));
}

.effect-label {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 248, 217, .92);
  color: #5d422b;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}

@keyframes bubbleFloat {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(.6); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 60px)) scale(.8); }
}

@keyframes impactBurst {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(.3) rotate(0deg); }
  30% { opacity: 1; transform: translate(-50%, -50%) scale(1.3) rotate(10deg); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8) rotate(-5deg); }
}
</style>
