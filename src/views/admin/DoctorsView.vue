<script setup>
import { ref, reactive, computed } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import StatCard from '../../components/StatCard.vue'
import Modal from '../../components/Modal.vue'
import { useDoctorsStore } from '../../stores/doctors'
import { useCentersStore } from '../../stores/centers'
import { useChildrenStore } from '../../stores/children'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatNumber, formatCompact } from '../../utils/format'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'

const route = useRoute()
const doctorsStore = useDoctorsStore()
const centersStore = useCentersStore()
const childrenStore = useChildrenStore()
const auth = useAuthStore()
const toast = useToastStore()

/* ---------------- الإحصائيات العلوية: محسوبة فعليًا من المتاجر ---------------- */
const pendingLabel = computed(() => formatNumber(doctorsStore.pendingCount))
const urgentTrend = computed(() =>
  doctorsStore.urgentPendingCount > 0 ? `${doctorsStore.urgentPendingCount} تنبيهات عاجلة` : 'لا تنبيهات عاجلة'
)

const capacityLabel = computed(() => `${formatCompact(centersStore.totalDailyCapacity)} طفل/يوم`)
const utilizationPercent = computed(() => {
  if (!centersStore.totalDailyCapacity) return 0
  return Math.round((childrenStore.averageDailyVaccinations / centersStore.totalDailyCapacity) * 100)
})

const activeCentersLabel = computed(() => formatNumber(centersStore.activeCount))
const inactiveCentersFooter = computed(() =>
  centersStore.inactiveCount > 0 ? `${centersStore.inactiveCount} مغلقة مؤقتاً` : 'كل المراكز نشطة'
)

const totalDoctorsLabel = computed(() => formatNumber(doctorsStore.total))
const newDoctorsTrend = computed(() =>
  doctorsStore.newThisMonth > 0 ? `+${doctorsStore.newThisMonth} هذا الشهر` : 'لا جديد هذا الشهر'
)

const query = ref('')

const filteredDoctors = computed(() => {
  if (!query.value.trim()) return doctorsStore.list
  return doctorsStore.list.filter((d) => d.name.includes(query.value) || d.center.includes(query.value))
})

const canManage = computed(() => auth.can('doctors.manage'))

/* ---------------- إضافة / تعديل بيانات الطبيب عبر نافذة منبثقة ---------------- */
const centersOptions = ['مركز النور الصحي', 'مستشفى الأمل', 'مركز الرعاية الصحية', 'مركز الحياة الصحي']
const rolesOptions = ['مسؤول طبي', 'طبيب تطعيمات', 'طبيب مقيم', 'ممرض/ة']

const isModalOpen = ref(false)
const modalMode = ref('edit') // 'edit' | 'add'
const editingId = ref(null)
const form = reactive({ name: '', email: '', phone: '', nationalId: '', centerId: '', password: 'Doctor@123', specialization: 'طب الأطفال' })

function resetForm() {
  form.name = ''
  form.email = ''
  form.phone = ''
  form.nationalId = ''
  form.centerId = centersStore.list[0]?.id || ''
  form.password = 'Doctor@123'
  form.specialization = 'طب الأطفال'
}

function openAdd() {
  modalMode.value = 'add'
  editingId.value = null
  resetForm()
  isModalOpen.value = true
}

function openEdit(doctor) {
  modalMode.value = 'edit'
  editingId.value = doctor.id
  form.name = doctor.name
  form.email = doctor.email
  form.phone = doctor.phone || ''
  form.nationalId = doctor.national_id || doctor.nationalId || ''
  form.centerId = doctor.center_id || doctor.centerId || centersStore.list[0]?.id || ''
  form.password = ''
  form.specialization = doctor.specialization || 'طب الأطفال'
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitForm() {
  if (!form.name.trim() || !form.email.trim()) {
    toast.error('بيانات ناقصة', 'يرجى تعبئة الاسم والبريد الإلكتروني على الأقل.')
    return
  }

  try {
    const payload = {
      name: form.name,
      email: form.email,
      national_id: form.nationalId || String(Math.floor(10000000000 + Math.random() * 90000000000)),
      center_id: form.centerId || centersStore.list[0]?.id || 1,
      phone: form.phone,
      specialization: form.specialization,
      is_active: true
    }

    if (form.password) {
      payload.password = form.password
    } else if (modalMode.value === 'add') {
      payload.password = 'Doctor@123'
    }

    if (modalMode.value === 'add') {
      await doctorsStore.add(payload)
      toast.success('تمت الإضافة', `تم إضافة حساب الطبيب ${form.name} بنجاح.`)
    } else {
      await doctorsStore.update(editingId.value, payload)
      toast.success('تم الحفظ', 'تم تحديث بيانات الطبيب بنجاح.')
    }
    closeModal()
  } catch (err) {
    toast.error('خطأ', err.message || 'حدث خطأ أثناء حفظ بيانات الطبيب')
  }
}

async function suspendDoctor(doctor) {
  try {
    await doctorsStore.remove(doctor.id)
    toast.info('تم تعليق الحساب', `تم تعليق/حذف حساب ${doctor.name}.`)
  } catch (err) {
    toast.error('خطأ', err.message || 'تعذر تعليق الحساب')
  }
}

const editingDoctorLabel = computed(() => {
  if (modalMode.value === 'add') return null
  return doctorsStore.byId(editingId.value)
})

onMounted(async () => {
  await Promise.allSettled([
    doctorsStore.fetchDoctors(),
    centersStore.fetchCenters(true)
  ])
  if (route.query.action === 'add') {
    openAdd()
  } else if (route.query.action === 'edit' && route.query.id) {
    const docToEdit = doctorsStore.byId(route.query.id)
    if (docToEdit) openEdit(docToEdit)
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
        <router-link :to="{ path: '/admin/centers', query: { action: 'add' } }" class="btn btn-outline">
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M3 21V9l9-6 9 6v12h-6v-7H9v7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>
  إضافة مركز جديد
</router-link>

        <button class="btn btn-primary" @click="openAdd">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="1.6"/>
            <path d="M12 8v8M8 12h8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          إضافة حساب طبيب
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard
        label="طلبات تسجيل معلقة"
        :value="pendingLabel"
        :trend="urgentTrend"
        :trend-type="doctorsStore.urgentPendingCount > 0 ? 'down' : 'neutral'"
        icon-bg="var(--color-danger-100)"
        icon-color="var(--color-danger-600)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M12 14v3M12 20h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="سعة التطعيم اليومية"
        :value="capacityLabel"
        :trend="`${utilizationPercent}% استخدام`"
        trend-type="up"
        icon-bg="var(--color-green-50)"
        icon-color="var(--color-green-800)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 5 6v6c0 5.2 3.4 9 7 10 3.6-1 7-4.8 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
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
        label="إجمالي الأطباء"
        :value="totalDoctorsLabel"
        :trend="newDoctorsTrend"
        :trend-type="doctorsStore.newThisMonth > 0 ? 'up' : 'neutral'"
        icon-bg="var(--color-green-50)"
        icon-color="var(--color-green-800)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M12 11v5M9.5 13.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </template>
      </StatCard>
    </div>

    <section class="card table-panel">
      <div class="table-panel__head">
        <h2 class="panel__title">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/>
            <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M16 5.5a3 3 0 0 1 0 6M18 12.5c2.3.4 4 2.4 4 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          إدارة حسابات الأطباء
        </h2>
        <label class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input v-model="query" type="text" placeholder="بحث عن طبيب..." />
        </label>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>الطبيب</th>
            <th>المركز التابع</th>
            <th>البريد الالكتروني</th>
            <th>الصلاحيات</th>
            <th v-if="canManage">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in filteredDoctors" :key="d.id">
            <td class="cell-doctor">
              <span class="avatar" :style="{ background: d.color }">{{ d.initials }}</span>
              {{ d.name }}
            </td>
            <td class="cell-muted">{{ d.center }}</td>
            <td class="cell-muted">{{ d.email }}</td>
            <td>
              <span class="badge" :class="d.roleTone === 'success' ? 'badge-success' : 'badge-info'">
                {{ d.role }}
              </span>
            </td>
            <td v-if="canManage">
              <div class="row-actions">
                <button class="icon-btn icon-btn--danger" aria-label="تعليق الحساب" @click="suspendDoctor(d)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
                    <path d="m6 6 12 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="icon-btn" aria-label="تعديل" @click="openEdit(d)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredDoctors.length">
            <td :colspan="canManage ? 5 : 4" class="empty-row">لا توجد نتائج مطابقة لبحثك.</td>
          </tr>
        </tbody>
      </table>

      <div class="table-panel__footer">
        <button class="link-btn">عرض جميع الكوادر ({{ totalDoctorsLabel }})</button>
      </div>
    </section>

    <!-- نافذة إضافة / تعديل بيانات الطبيب -->
    <Modal
      :open="isModalOpen"
      :title="modalMode === 'add' ? 'إضافة حساب طبيب جديد' : 'تعديل بيانات الطبيب'"
      subtitle="حدّث المعلومات ثم اضغط حفظ"
      @close="closeModal"
    >
      <div v-if="editingDoctorLabel" class="doctor-modal-head">
        <span class="avatar avatar--lg" :style="{ background: editingDoctorLabel.color }">
          {{ editingDoctorLabel.initials }}
        </span>
        <div>
          <p class="doctor-modal-head__name">{{ editingDoctorLabel.name }}</p>
          <p class="doctor-modal-head__center">{{ editingDoctorLabel.center }}</p>
        </div>
      </div>

      <div class="form-field">
        <label>اسم الطبيب</label>
        <input v-model="form.name" type="text" placeholder="اسم الطبيب الكامل" />
      </div>

      <div class="form-field">
        <label>البريد الإلكتروني</label>
        <input v-model="form.email" type="email" placeholder="example@domain.com" />
      </div>

      <div class="form-field">
        <label>كلمة المرور {{ modalMode === 'edit' ? '(اتركها فارغة للاحتفاظ بالحالية)' : '' }}</label>
        <input v-model="form.password" type="text" placeholder="تعيين كلمة مرور للطبيب" />
      </div>

      <div class="form-field">
        <label>رقم الجوال</label>
        <input v-model="form.phone" type="tel" dir="ltr" placeholder="+963 9xx xxx xxx" />
      </div>

      <div class="form-field">
        <label>رقم الهوية الوطنية</label>
        <input v-model="form.nationalId" type="text" placeholder="11 رقمًا" />
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>المركز التابع</label>
          <select v-model="form.centerId" required>
            <option disabled value="">اختر المركز الصحي</option>
            <option v-for="c in centersStore.list" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="form-field">
          <label>التخصص</label>
          <input v-model="form.specialization" type="text" placeholder="مثال: طب الأطفال" />
        </div>
      </div>

      <template #footer>
        <button class="btn btn-outline" @click="closeModal">إلغاء</button>
        <button class="btn btn-primary" @click="submitForm">
          {{ modalMode === 'add' ? 'إضافة الطبيب' : 'حفظ التعديلات' }}
        </button>
      </template>
    </Modal>
  </AdminLayout>
</template>

<style scoped>
.stats-grid {
  margin-top: 24px;
}

.table-panel {
  padding: 26px;
}

.table-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface-muted);
  border-radius: 12px;
  padding: 10px 14px;
  color: var(--color-text-muted);
  width: 260px;
}

.search input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: var(--color-text);
}

.cell-doctor {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-muted {
  color: var(--color-text-muted);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.empty-row {
  text-align: center;
  color: var(--color-text-muted);
  padding: 30px 0;
}

.table-panel__footer {
  text-align: center;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.link-btn {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-green-800);
}

.link-btn:hover {
  text-decoration: underline;
}

/* نافذة تعديل الطبيب */
.doctor-modal-head {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  margin-bottom: 20px;
}

.avatar--lg {
  width: 46px;
  height: 46px;
  font-size: 15px;
}

.doctor-modal-head__name {
  font-weight: 800;
  font-size: 15px;
}

.doctor-modal-head__center {
  font-size: 12.5px;
  color: var(--color-text-muted);
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
  padding: 12px 14px; 
  border-radius: 12px; 
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
  border-color: var(--color-green-800); 
  box-shadow: 0 0 0 3px var(--color-green-50);
}
</style>
