<template>
  <div class="details-page">
    <div class="details-topbar">
<div class="logo">
  <LogoIcon /> لقاحي
</div>
    </div>

    <div v-if="!child" class="details-card">
      <p class="no-data">لم يتم العثور على بيانات لهذا الطفل.</p>
    </div>

    <div v-else class="details-card">
      <div class="child-photo-section">
        <div v-if="!child.photo" class="child-photo-placeholder" :class="child.gender">
          <i class="ti ti-user"></i>
        </div>
        <img v-else :src="child.photo" :alt="child.fullName" class="child-photo" />
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
import LogoIcon from '../components/LogoIcon.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChildrenStore } from '../stores/children'

const route = useRoute()
const childrenStore = useChildrenStore()

const child = computed(() => childrenStore.getChildById(route.params.childId))

const completedDoses = computed(() =>
  (child.value?.doses || []).filter((d) => d.status === 'completed')
)

const age = computed(() => {
  if (!child.value?.birthDate) return '-'
  const birth = new Date(child.value.birthDate)
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
.details-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.details-topbar {
  margin-bottom: 20px;
}

.logo {
  font-weight: 700;
  font-size: 18px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo svg {
  width: 24px;    
  height: 24px;  
}

.details-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 420px;
}

.child-photo-section {
  text-align: center;
  margin-bottom: 20px;
}

.child-photo,
.child-photo-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin: 0 auto 10px;
}

.child-photo {
  object-fit: cover;
}

.child-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #fff;
}

.child-photo-placeholder.male {
  background: #4f8ef7;
}

.child-photo-placeholder.female {
  background: #f472b6;
}

.child-name {
  margin: 0;
  font-weight: 700;
  font-size: 16px;
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
  text-align: center;
}
</style>