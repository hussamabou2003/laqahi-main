<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})

const emit = defineEmits(['close'])
</script>

<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="open" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-box" role="dialog" aria-modal="true">
          <div class="modal-box__head">
            <div>
              <h3 class="modal-box__title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-box__subtitle">{{ subtitle }}</p>
            </div>
            <button class="modal-box__close" aria-label="إغلاق" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-box__body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal-box__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 30, 26, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.modal-box {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(11, 74, 52, 0.25);
}

.modal-box__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-box__title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 4px;
}

.modal-box__subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.modal-box__close {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.modal-box__close:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.modal-box__body {
  padding: 22px 24px;
}

.modal-box__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 22px;
}

/* انتقال ظهور/اختفاء ناعم */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from .modal-box,
.modal-fade-leave-to .modal-box {
  transform: translateY(12px) scale(0.98);
}
</style>
