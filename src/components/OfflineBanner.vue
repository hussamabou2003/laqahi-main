<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(navigator.onLine)

function update() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
})

onUnmounted(() => {
  window.removeEventListener('online', update)
  window.removeEventListener('offline', update)
})
</script>

<template>
  <transition name="slide-down">
    <div v-if="!isOnline" class="offline-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M2 8.5C7 4 17 4 22 8.5M5.5 12c3.5-2.7 9.5-2.7 13 0M9 15.5c1.7-1.3 4.3-1.3 6 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="m3 3 18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="12" cy="19" r="1" fill="currentColor"/>
      </svg>
      أنت غير متصل بالإنترنت حالياً — قد لا تعمل بعض ميزات النظام إلى حين عودة الاتصال.
    </div>
  </transition>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: 300;
  background: var(--color-danger-600);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
