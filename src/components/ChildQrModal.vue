<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>بيانات الطفل</h3>
        <button class="modal-close" type="button" @click="$emit('close')" aria-label="إغلاق">
          <i class="ti ti-x"></i>
        </button>
      </div>

      <div class="child-summary">
        <img :src="child.photo" :alt="child.fullName" class="child-photo" />
        <p class="child-name">{{ child.fullName }}</p>
        <span class="child-id">ID: {{ child.id }}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <span class="detail-label">الجنس</span>
          <span class="detail-value">{{ child.gender === 'male' ? 'ذكر' : 'أنثى' }}</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">العمر</span>
          <span class="detail-value">{{ age }}</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">الطول</span>
          <span class="detail-value">{{ child.height ?? '-' }} سم</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">الوزن</span>
          <span class="detail-value">{{ child.weight ?? '-' }} كجم</span>
        </div>
      </div>

      <div class="vaccines-section">
        <h4>اللقاحات المأخوذة لحد الآن ({{ completedDoses.length }})</h4>
        <ul v-if="completedDoses.length" class="vaccines-list">
          <li v-for="dose in completedDoses" :key="dose.id">
            <i class="ti ti-check"></i>
            <span class="dose-name">{{ dose.name }}</span>
            <span class="dose-date">{{ formatDate(dose.date) }}</span>
          </li>
        </ul>
        <p v-else class="no-data">لم يُسجَّل أي لقاح بعد.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  child: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const completedDoses = computed(() =>
  (props.child.doses || []).filter((d) => d.status === 'completed')
)

const age = computed(() => {
  if (!props.child.birthDate) return '-'
  const birth = new Date(props.child.birthDate)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (now.getDate() < birth.getDate()) months--
  if (months < 0) {
    years--
    months += 12
  }

  if (years > 0) {
    return months > 0 ? `${years} سنة و${months} شهر` : `${years} سنة`
  }
  return `${months} شهر`
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
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
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--color-text-muted);
}

.child-summary {
  text-align: center;
  margin-bottom: 16px;
}

.child-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.child-name {
  margin: 0;
  font-weight: 700;
}

.child-id {
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.detail-box {
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.detail-value {
  font-weight: 700;
  color: var(--color-primary-dark);
}

.vaccines-section h4 {
  font-size: 14px;
  margin: 0 0 10px;
}

.vaccines-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vaccines-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.vaccines-list li i {
  color: var(--color-primary);
}

.dose-name {
  flex: 1;
  font-weight: 500;
}

.dose-date {
  color: var(--color-text-muted);
  font-size: 12px;
}

.no-data {
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>