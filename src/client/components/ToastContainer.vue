<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id"
        class="toast" :class="[`toast-${toast.type}`, { 'toast-hidden': !toast.visible }]">
        {{ toast.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'
const { toasts } = useToast()
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  left: 50%;
  top: 86px;
  transform: translateX(-50%);
  z-index: 34;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  max-width: min(620px, calc(100vw - 80px));
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 850;
  text-align: center;
  transition: opacity .25s ease, transform .25s ease;
  pointer-events: none;
}

.toast-action {
  color: #5f432b;
  background: linear-gradient(145deg, rgba(255, 248, 217, .96), rgba(240, 207, 142, .92));
  border: 2px solid rgba(123, 82, 43, .24);
  box-shadow: 0 10px 0 rgba(112, 79, 43, .18), 0 14px 22px rgba(69, 73, 35, .18), inset 0 1px 0 rgba(255,255,255,.75);
}

.toast-hand {
  color: #8b2b20;
  background: rgba(255, 246, 229, .96);
  border: 2px solid rgba(239, 68, 68, .24);
  box-shadow: 0 8px 18px rgba(0,0,0,.10);
}

.toast-receive {
  color: #fff8da;
  background: rgba(30, 34, 13, .86);
  border: 1px solid rgba(245, 214, 118, .35);
  box-shadow: 0 16px 30px rgba(0,0,0,.32);
  backdrop-filter: blur(10px);
}

.toast-hidden {
  opacity: 0;
  transform: translateY(-12px);
}

.toast-enter-active { transition: all .25s ease; }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
