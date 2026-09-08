<template>
  <div class="child-card">
    <!-- رأس البطاقة: الدائرة الرمزية + الاسم ورقم الهوية -->
    <div class="card-header">
      <div class="avatar-circle" :style="{ backgroundColor: avatarStyle.bg, borderColor: avatarStyle.border, color: avatarStyle.color }">
        {{ getInitials(child.fullName || child.name) }}
      </div>
      <div class="name-id-wrap">
        <h3 class="child-name">{{ child.fullName || child.name }}</h3>
        <span class="id-badge">ID: {{ child.nationalId || child.id }}</span>
      </div>
    </div>

    <!-- قسم تقدم التطعيمات والشريط الأخضر -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-title">تقدم التطعيمات</span>
        <span class="progress-pct">{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- تفاصيل الجرعة القادمة -->
    <div class="dose-details">
      <div class="dose-info">
        <span class="dose-title">{{ nextDoseInfo.name }}</span>
        <span class="dose-date">{{ nextDoseInfo.date }}</span>
      </div>
      <span class="dose-label">الجرعة القادمة</span>
    </div>

    <label v-if="centers.length" class="center-picker">
      <span>المركز الصحي</span>
      <select :value="child.center_id || child.centerId || child.center?.id || ''" @change="$emit('center-change', { childId: child.id, centerId: $event.target.value })">
        <option v-for="center in centers" :key="center.id" :value="center.id">{{ center.name }}</option>
      </select>
    </label>

    <!-- زر عرض التفاصيل -->
    <button type="button" class="btn-show-details" @click="goToDashboardWithChild">
      عرض التفاصيل
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChildrenStore } from '../stores/children'
import { VACCINE_SCHEDULE } from '../stores/vaccines'

const props = defineProps({
  child: {
    type: Object,
    required: true
  },
  centers: {
    type: Array,
    default: () => []
  }
})

defineEmits(['center-change'])

const router = useRouter()
const childrenStore = useChildrenStore()

// استخراج أول حرفين من اسم الطفل للدائرة
function getInitials(name) {
  if (!name) return 'طف'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.slice(0, 2)
}

const avatarPalette = [
  { bg: '#dbeafe', border: '#60a5fa', color: '#1e3a8a' }, // أزرق
  { bg: '#fce7f3', border: '#f472b6', color: '#831843' }, // وردي
  { bg: '#fef9c3', border: '#facc15', color: '#713f12' }, // أصفر
  { bg: '#ccfbf1', border: '#2dd4bf', color: '#134e4a' }  // تركواز
]

const avatarStyle = computed(() => {
  const charCode = (props.child.fullName || props.child.name || 'a').charCodeAt(0)
  return avatarPalette[charCode % avatarPalette.length]
})

// حساب إجمالي اللقاحات في الجدول الوطني
const totalVaccinesInSchedule = computed(() => {
  return VACCINE_SCHEDULE.reduce((sum, stage) => sum + (stage.vaccines?.length || 0), 0) || 1
})

// حساب نسبة التقدم الحقيقية بناءً على ما أخذه الطفل فعلاً
const progressPercent = computed(() => {
  const doses = props.child.doses || []
  const completedDoses = doses.filter(d => d.status === 'completed')

  // إذا لم يأخذ أي لقاح فالنسبة 0% فوراً
  if (completedDoses.length === 0) return 0

  return Math.round((completedDoses.length / totalVaccinesInSchedule.value) * 100)
})

// جلب تفاصيل الجرعة القادمة
const nextDoseInfo = computed(() => {
  const dose = childrenStore.getNextDose ? childrenStore.getNextDose(props.child.id) : null
  if (dose) {
    const formattedDate = dose.date 
      ? new Date(dose.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-'
    return {
      name: dose.name || 'الجرعة القادمة',
      date: formattedDate
    }
  }

  // إذا لم توجد جرعات مسجلة مسبقاً
  return {
    name: 'لقاحات عند الولادة (BCG/HepB)',
    date: 'مستحقة الآن'
  }
})

function goToDashboardWithChild() {
  router.push({
    path: '/dashboard',
    query: { childId: props.child.id }
  })
}
</script>

<style scoped>
.child-card {
  background: var(--color-card);
  border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 290px;
  direction: rtl;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.avatar-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 700;
  flex-shrink: 0;
}

.name-id-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.child-name {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--color-text);
}

.id-badge {
  background: var(--color-teal-800);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.progress-pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: var(--color-surface-muted);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-green-500);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.dose-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.dose-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.dose-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text);
}

.dose-date {
  font-size: 11px;
  color: var(--color-text-muted);
}

.dose-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.center-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.center-picker select {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-card);
  color: var(--color-text);
  font: inherit;
}

.btn-show-details {
  width: 100%;
  padding: 10px 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-show-details:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border);
}
</style>