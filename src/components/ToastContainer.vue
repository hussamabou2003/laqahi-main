<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
const { items } = storeToRefs(toastStore)

const icons = {
  success: 'm5 13 4 4L19 7',
  error: 'm6 6 12 12M18 6 6 18',
  warning: 'M12 3 2 20h20L12 3Z',
  info: 'M12 8h.01M11 12h1v4h1'
}
</script>

<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in items" :key="t.id" class="toast" :class="`toast--${t.type}`">
        <span class="toast__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path :d="icons[t.type] || icons.info" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <div class="toast__body">
          <p class="toast__title">{{ t.title }}</p>
          <p v-if="t.message" class="toast__message">{{ t.message }}</p>
        </div>
        <button class="toast__close" aria-label="إغلاق" @click="toastStore.dismiss(t.id)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 320px;
  max-width: calc(100vw - 40px);
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 14px;
  box-shadow: var(--shadow-md);
}

.toast__icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast--success .toast__icon {
  background: var(--color-green-100);
  color: var(--color-green-800);
}

.toast--error .toast__icon {
  background: var(--color-danger-100);
  color: var(--color-danger-600);
}

.toast--warning .toast__icon {
  background: var(--color-warning-100);
  color: var(--color-warning-600);
}

.toast--info .toast__icon {
  background: var(--color-info-100);
  color: var(--color-info-600);
}

.toast__body {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-size: 13.5px;
  font-weight: 700;
}

.toast__message {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
  line-height: 1.5;
}

.toast__close {
  color: var(--color-text-soft);
  flex-shrink: 0;
}

.toast__close:hover {
  color: var(--color-text);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
