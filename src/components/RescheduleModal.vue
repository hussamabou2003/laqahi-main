<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
  <!-- استخدام اسم الطفل هنا -->
  <h3>إعادة جدولة موعد {{ childName }}</h3> 
  <button type="button" class="modal-close" @click="$emit('close')" aria-label="إغلاق">
    <i class="ti ti-x"></i>
  </button>
</div>

      <p class="modal-desc">اختر أحد الأوقات المتاحة أدناه المحدّدة من قِبل الطاقم الطبي:</p>

      <div v-if="availabilityStore.availableSlots.length" class="slots-list">
        <button
          v-for="slot in availabilityStore.availableSlots"
          :key="slot.id"
          type="button"
          class="slot-btn"
          @click="handleSelect(slot)"
        >
          <span class="slot-date">{{ formatDate(slot.date) }}</span>
          <span class="slot-time">{{ slot.time }}</span>
        </button>
      </div>
      <p v-else class="no-data">لا توجد أوقات متاحة حاليًا، يُرجى مراجعة المركز الصحي.</p>
    </div>
  </div>
</template>

<script setup>
import { useAvailabilityStore } from '../stores/availability'

defineProps({
  childName: { type: String, required: true }
})
const emit = defineEmits(['close', 'select'])

const availabilityStore = useAvailabilityStore()

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })
}

function handleSelect(slot) {
  emit('select', slot)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-box {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--color-text-muted);
}

.modal-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.slot-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.slot-time {
  font-weight: 700;
  color: var(--color-primary-dark);
}

.no-data {
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
}
</style>