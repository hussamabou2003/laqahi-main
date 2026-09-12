<script setup>
import { ref, reactive, computed } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import StatCard from '../../components/StatCard.vue'
import { useCentersStore } from '../../stores/centers'
import { useChildrenStore } from '../../stores/children'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatNumber, formatCompact } from '../../utils/format'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'
import GovernorateSelect from '../../components/GovernorateSelect.vue'

const route = useRoute()
const centersStore = useCentersStore()
const childrenStore = useChildrenStore()
const auth = useAuthStore()
const toast = useToastStore()

const canManage = computed(() => auth.can('centers.manage'))

/* ---------------- الإحصائيات العلوية ---------------- */
const capacityLabel = computed(() => `${formatCompact(centersStore.totalDailyCapacity)} طفل/يوم`)
const utilizationTrend = computed(() => {
  if (!centersStore.totalDailyCapacity) return '—'
  const percent = Math.round((childrenStore.averageDailyVaccinations / centersStore.totalDailyCapacity) * 100)
  return `${percent}% استخدام`
})

const activeCentersLabel = computed(() => formatNumber(centersStore.activeCount))
const inactiveCentersFooter = computed(() =>
  centersStore.inactiveCount > 0 ? `${centersStore.inactiveCount} مغلقة مؤقتاً` : 'كل المراكز نشطة'
)

const totalCentersLabel = computed(() => formatNumber(centersStore.total))
const regionsFooter = computed(() => `في ${centersStore.regionsCount} مناطق إدارية`)

const GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية',
  'طرطوس', 'إدلب', 'الرقة', 'دير الزور', 'الحسكة',
  'درعا', 'السويداء', 'القنيطرة'
]

const selectedRegion = ref(GOVERNORATES[0])
const facilityType = ref('حكومي') // حكومي | خاص

async function deleteCenter(center) {
  try {
    await centersStore.remove(center.id)
    toast.info('تم الحذف', `تم حذف ${center.name} من قائمة المراكز.`)
    if (panelMode.value === 'edit' && editingCenterId.value === center.id) cancelPanel()
  } catch (err) {
    toast.error('خطأ', err.message || 'فشل حذف المركز')
  }
}

/* ---------------- لوحة التعديل السريع / الإضافة ---------------- */
const statusOptions = ['نشط', 'مغلق مؤقتاً']
const panelMode = ref(null) // null | 'edit' | 'add'
const editingCenterId = ref(null)
const centerForm = reactive({ name: '', province: '', location: '', phone: '', status: statusOptions[0] })

function resetCenterForm() {
  centerForm.name = ''
  centerForm.province = ''
  centerForm.location = ''
  centerForm.phone = ''
  centerForm.status = statusOptions[0]
}

function openAddPanel() {
  panelMode.value = 'add'
  editingCenterId.value = null
  resetCenterForm()
    setTimeout(() => {
    document.querySelector('.quick-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 150)
}

function selectCenterForEdit(center) {
  panelMode.value = 'edit'
  editingCenterId.value = center.id
  Object.assign(centerForm, center)
  // Ensure province is populated if available
  if (center.province) centerForm.province = center.province
  setTimeout(() => {
    document.querySelector('.quick-edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 150)
}

function cancelPanel() {
  panelMode.value = null
  editingCenterId.value = null
}

async function savePanel() {
  if (!centerForm.name.trim() || !centerForm.location.trim() || !centerForm.province) {
    toast.error('بيانات ناقصة', 'يرجى تعبئة اسم المركز والمحافظة والموقع.')
    return
  }

  try {
    const payload = {
      name: centerForm.name,
      province: centerForm.province,
      address: centerForm.location,
      phone: centerForm.phone,
      status: centerForm.status
    }

    if (panelMode.value === 'add') {
      await centersStore.add(payload)
      toast.success('تمت الإضافة', `تم إضافة ${centerForm.name} إلى قائمة المراكز.`)
    } else {
      await centersStore.update(editingCenterId.value, payload)
      toast.success('تم الحفظ', 'تم تحديث بيانات المركز بنجاح.')
    }
    cancelPanel()
  } catch (err) {
    toast.error('خطأ', err.message || 'حدث خطأ أثناء حفظ المركز')
  }
}

/* ---------------- تفعيل الخريطة التفاعلية عبر خرائط جوجل ---------------- */
function openMap() {
  const facilityLabel = facilityType.value === 'حكومي' ? 'مركز صحي حكومي' : 'مستشفى خاص'
  const query = `${facilityLabel} ${selectedRegion.value}`
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
}

function openCenterMap(center) {
  const provinceStr = center.province ? `${center.province} ` : ''
  const query = `${center.name} ${provinceStr}${center.location}`
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank')
}

onMounted(async () => {
  await centersStore.fetchCenters(true)
  if (route.query.action === 'add') {
    openAddPanel()
  } else if (route.query.action === 'edit' && route.query.id) {
    const centerToEdit = centersStore.list.find(c => String(c.id) === String(route.query.id))
    if (centerToEdit) selectCenterForEdit(centerToEdit)
  }
})

</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <div>
        <h1 class="page-head__title">إدارة الحسابات والمراكز</h1>
        <p class="page-head__subtitle">مراقبة وإدارة الكوادر الطبية والمرافق الصحية التابعة للنظام.</p>
      </div>
      <div class="page-head__actions" v-if="canManage">
        <button class="btn btn-primary" @click="openAddPanel">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M3 21V9l9-6 9 6v12h-6v-7H9v7Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          إضافة مركز جديد
        </button>
      </div>
    </div>

    <div class="stats-grid stats-grid--3">
      <StatCard
        label="سعة التطعيم اليومية"
        :value="capacityLabel"
        :trend="utilizationTrend"
        trend-type="up"
        icon-bg="var(--color-green-50)"
        icon-color="var(--color-green-800)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="مراكز مفعلة"
        :value="activeCentersLabel"
        :footer="inactiveCentersFooter"
        icon-bg="var(--color-info-100)"
        icon-color="var(--color-info-600)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 21V9l8-5 8 5v12" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M9 21v-6h6v6M4 21h16" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="إجمالي المراكز"
        :value="totalCentersLabel"
        :footer="regionsFooter"
        icon-bg="var(--color-danger-100)"
        icon-color="var(--color-danger-600)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </template>
      </StatCard>
    </div>

    <section class="card table-panel">
      <div class="table-panel__head">
        <h2 class="panel__title">إدارة مراكز اللقاحات</h2>
        <button v-if="canManage" class="add-link" @click="openAddPanel">+ إضافة مركز</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>اسم المركز</th>
            <th>الموقع</th>
            <th>الجوال</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in centersStore.list" :key="c.id">
            <td class="cell-strong">{{ c.name }}</td>
            <td class="cell-muted">{{ c.location }}</td>
            <td class="cell-muted" dir="ltr">{{ c.phone }}</td>
            <td>
              <span class="badge" :class="c.status === 'نشط' ? 'badge-success' : 'badge-danger'">
                {{ c.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button v-if="canManage" class="icon-btn icon-btn--danger" aria-label="حذف المركز" @click="deleteCenter(c)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  v-if="canManage"
                  class="icon-btn"
                  :class="{ 'icon-btn--active': panelMode === 'edit' && editingCenterId === c.id }"
                  aria-label="تعديل"
                  @click="selectCenterForEdit(c)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="icon-btn" aria-label="عرض على الخريطة" @click="openCenterMap(c)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="lower-grid">
      <!-- تحديد نطاق الخدمة -->
      <section class="card scope-panel">
        <h2 class="panel__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 21V9l9-6 9 6v12h-6v-7H9v7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
          تحديد نطاق الخدمة
        </h2>

        <label class="field-label">اسم المنطقة</label>
        <GovernorateSelect v-model="selectedRegion" />

        <label class="field-label">نوع المرفق</label>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            :class="{ 'toggle-btn--active': facilityType === 'حكومي' }"
            @click="facilityType = 'حكومي'"
          >
            مركز حكومي
          </button>
          <button
            class="toggle-btn"
            :class="{ 'toggle-btn--active': facilityType === 'خاص' }"
            @click="facilityType = 'خاص'"
          >
            مستشفى خاص
          </button>
        </div>

        <button class="btn btn-primary map-btn" @click="openMap">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M9 4v14M15 6.5v14" stroke="#fff" stroke-width="1.6"/>
          </svg>
          فتح الخريطة التفاعلية
        </button>
        <p class="map-hint">ستُفتح خرائط Google في نافذة جديدة مع نتائج مطابقة للمنطقة ونوع المرفق المحددين.</p>
      </section>

      <!-- التعديل السريع / الإضافة: يظهر داخل نفس البطاقة دون مغادرة الصفحة -->
      <section class="card quick-edit-panel">
        <template v-if="panelMode === null">
          <div class="empty-state">
            <span class="empty-panel__icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </span>
            <p class="empty-panel__title">اختر مركزاً للتعديل السريع</p>
            <p class="empty-panel__desc">
              اضغط أيقونة التعديل ✎ بجانب أي مركز في الجدول أعلاه، أو زر "إضافة مركز جديد"،
              وستظهر بياناته هنا لتتمكن من العمل عليها فوراً دون مغادرة الصفحة.
            </p>
          </div>
        </template>

        <template v-else>
          <div class="quick-edit-panel__head">
            <h2 class="panel__title">{{ panelMode === 'add' ? 'إضافة مركز جديد' : 'تعديل بيانات المركز' }}</h2>
            <button class="icon-btn" aria-label="إغلاق" @click="cancelPanel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="form-field">
            <label>اسم المركز</label>
            <input v-model="centerForm.name" type="text" placeholder="مثال: مركز الروضة الصحي" />
          </div>

          <div class="form-field">
            <label>المحافظة</label>
            <GovernorateSelect v-model="centerForm.province" placeholder="اختر المحافظة السورية" />
          </div>

          <div class="form-field">
            <label>الموقع التفصيلي</label>
            <input v-model="centerForm.location" type="text" placeholder="مثال: دمشق - المزة - مقابل البلدية" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>رقم الجوال</label>
              <input v-model="centerForm.phone" type="tel" dir="ltr" placeholder="+963 9xx xxx xxx" />
            </div>
            <div class="form-field">
              <label>الحالة</label>
              <select v-model="centerForm.status">
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="quick-edit-panel__actions">
            <button class="btn btn-outline" @click="cancelPanel">إلغاء</button>
            <button class="btn btn-primary" @click="savePanel">
              {{ panelMode === 'add' ? 'إضافة المركز' : 'حفظ التعديلات' }}
            </button>
          </div>
        </template>
      </section>
    </div>
  </AdminLayout>
</template>

<style scoped>
.stats-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.stats-grid {
  margin-top: 24px;
}

.table-panel {
  padding: 26px;
  margin-bottom: 20px;
}

.table-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
}

.add-link {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-green-800);
}

.add-link:hover {
  text-decoration: underline;
}

.cell-strong {
  font-weight: 700;
}

.cell-muted {
  color: var(--color-text-muted);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.lower-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 20px;
}

.scope-panel {
  padding: 26px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  margin: 18px 0 8px;
}
/* التنسيق المتطابق تماماً مع حقول "نطاق الخدمة" */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-field label,
.form-field span {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.form-field input,
.form-field select {
  width: 100%;
  padding: 12px 14px; /* نفس المسافات في نطاق الخدمة */
  border-radius: 12px; /* نفس الحواف الدائرية */
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--color-green-800); /* لون الإطار عند التركيز */
  box-shadow: 0 0 0 3px var(--color-green-50);
}
.select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  font-size: 14px;
  color: var(--color-text);
}

.toggle-group {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.toggle-btn--active {
  background: var(--color-green-800);
  border-color: var(--color-green-800);
  color: #fff;
}

.map-btn {
  width: 100%;
  margin-top: 22px;
}

.map-hint {
  font-size: 12px;
  color: var(--color-text-soft);
  text-align: center;
  margin-top: 10px;
  line-height: 1.6;
}

.icon-btn--active {
  background: var(--color-green-800);
  color: #fff;
}

.quick-edit-panel {
  padding: 26px;
}

.empty-state {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 30px;
  height: 100%;
  min-height: 260px;
}

.quick-edit-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.quick-edit-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.empty-panel__icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.empty-panel__title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-panel__desc {
  font-size: 13.5px;
  color: var(--color-text-muted);
  max-width: 320px;
}

@media (max-width: 1000px) {
  .stats-grid--3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .lower-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .stats-grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
