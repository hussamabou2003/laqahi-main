<template>
  <DoctorLayout>
    <div class="page-header">
      <div>
        <h1>سجلات الأطفال</h1>
        <p class="subtitle">إدارة سجلات الأطفال وحالات التحصين</p>
      </div>
    </div>

    <section class="stats-row">
      <div class="stat-card">
        <p class="stat-label">متأخر عن اللقاح</p>
        <p class="stat-value danger">{{ overdueCount }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">مكتمل التحصين</p>
        <p class="stat-value">{{ completionPercent }}%</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">إجمالي الأطفال المسجلين</p>
        <p class="stat-value">{{ totalRegistered.toLocaleString() }}</p>
      </div>
    </section>

    <section class="card">
      <div class="search-row">
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input v-model="searchQuery" type="text" placeholder="البحث بالاسم، المعرف الوطني، هاتف الولي، أو رمز الطفل المميز (QR)..." />
        </div>
        <button type="button" class="btn-qr" @click="showQrScanner = true" title="مسح رمز QR">
          <i class="ti ti-qrcode"></i>
        </button>
        <button type="button" class="filter-btn"><i class="ti ti-filter"></i> جميع الحالات</button>
      </div>

      <table class="records-table">
        <thead>
          <tr>
            <th>اسم الطفل</th>
            <th>المعرف الوطني</th>
            <th>تاريخ الميلاد</th>
            <th>ولي الأمر</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRecords" :key="row.id">
            <td class="child-cell">
              <span class="avatar-letter" :class="row.gender">{{ row.childName.charAt(0) }}</span>
              <button type="button" class="child-name-link" @click="openVaccineCard(row.id)">
                {{ row.childName }}
              </button>
            </td>
            <td>{{ row.guardianNationalId }}</td>
            <td>{{ row.birthDate }}</td>
            <td>{{ row.guardianName }}</td>
            <td><span class="status-badge" :class="row.status">{{ statusLabel(row.status) }}</span></td>
            <td class="actions-cell">
              <router-link :to="`/doctor/create-guardian/${row.id}`" aria-label="تعديل">
                <i class="ti ti-edit"></i>
              </router-link>
              <button type="button" aria-label="اتصال"><i class="ti ti-phone"></i></button>
              <button type="button" @click="viewingChildId = row.id" aria-label="عرض">
                <i class="ti ti-eye"></i>
              </button>
              <button type="button" class="btn-delete" @click="handleDeleteChild(row)" aria-label="حذف">
                <i class="ti ti-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="selectedChild" class="vaccine-modal-backdrop" @click.self="closeVaccineCard">
      <section class="vaccine-modal" role="dialog" aria-modal="true">
        <header class="vaccine-modal__header">
          <div>
            <h2>البطاقة اللقاحية</h2>
            <p>{{ selectedChild.fullName }} · رقم الملف {{ selectedChild.id }}</p>
          </div>
          <button type="button" class="modal-close" @click="closeVaccineCard" aria-label="إغلاق">×</button>
        </header>

        <p v-if="vaccineError" class="form-error">{{ vaccineError }}</p>
        <div v-if="selectedChild.doses?.length" class="vaccine-dose-list">
          <article v-for="dose in selectedChild.doses" :key="dose.id" class="vaccine-dose-row">
            <div>
              <strong>{{ dose.name }}</strong>
              <small>{{ formatDate(dose.date) }}</small>
            </div>
            <span class="dose-status" :class="dose.status">{{ doseStatusLabel(dose.status) }}</span>
            <button
              v-if="dose.status !== 'completed' && dose.status !== 'cancelled'"
              type="button"
              class="btn btn-primary btn-xs"
              :disabled="completingDoseId === dose.id || !isDoseSelectable(dose.date)"
              @click="openDosePopup(dose.id)"
            >
              {{ completingDoseId === dose.id ? 'جارٍ التسجيل...' : 'تسجيل الجرعة' }}
            </button>
          </article>
        </div>
        <p v-else class="no-data">لا توجد جرعات مجدولة لهذا الطفل.</p>
      </section>

      <!-- شاشة منبثقة صغيرة لتسجيل الجرعة -->
      <div v-if="dosePopupState.show" class="dose-popup-overlay" @click.self="closeDosePopup">
        <div class="dose-popup">
          <h3>معلومات الجرعة</h3>
          <p class="dose-popup-subtitle">أدخل تفاصيل اللقاح لتسجيل الجرعة</p>
          <div class="form-field">
            <label>الشركة المصنعة</label>
            <input v-model="dosePopupState.manufacturer" type="text" placeholder="اسم الشركة (مثال: Pfizer)" />
          </div>
          <div class="form-field">
            <label>رقم التشغيلة</label>
            <input v-model="dosePopupState.batchNumber" type="text" placeholder="رقم التشغيلة (Batch Number)" />
          </div>
          <div class="dose-popup-actions">
            <button class="btn btn-outline" @click="closeDosePopup">إلغاء</button>
            <button class="btn btn-primary" @click="confirmDoseSubmit">حفظ الجرعة</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- مكون عرض بيانات الطفل -->
    <ChildQrModal
      v-if="viewingChildId"
      :child="childrenStore.getChildById(viewingChildId)"
      @close="viewingChildId = null"
    />

    <!-- مكون قارئ الـ QR -->
    <QrScannerModal
      v-if="showQrScanner"
      @close="showQrScanner = false"
      @scanned="handleQrScanned"
    />

  </DoctorLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import { useChildrenStore } from '../../stores/children'
import { useGuardiansStore } from '../../stores/guardians'
import ChildQrModal from '../../components/ChildQrModal.vue'
import QrScannerModal from '../../components/QrScannerModal.vue'
import { scanChildQrApi } from '../../utils/api'

const childrenStore = useChildrenStore()
const guardiansStore = useGuardiansStore()
const viewingChildId = ref(null)
const selectedChildId = ref(null)
const completingDoseId = ref(null)
const vaccineError = ref('')
const searchQuery = ref('')
const showQrScanner = ref(false)

async function handleQrScanned(qrCode) {
  showQrScanner.value = false
  try {
    const child = await scanChildQrApi(qrCode)
    if (child && child.id) {
      viewingChildId.value = child.id
    }
  } catch (err) {
    alert(err.message || 'رمز QR غير صالح أو أن الطفل غير مسجل في مركزك.')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(async () => {
  await childrenStore.fetchDoctorChildren()
})

const records = computed(() =>
  childrenStore.children.map((child) => {
    const guardian = guardiansStore.guardians.find((g) => (g.nationalId || g.national_id) === child.guardianNationalId)
    const totalDoses = child.doses?.length || 0
    const completedDoses = child.doses?.filter((d) => d.status === 'completed').length || 0
    const hasOverdue = child.doses?.some((d) => d.status === 'overdue')

    let status = 'in-progress'
    if (totalDoses > 0 && completedDoses === totalDoses) status = 'completed'
    else if (hasOverdue) status = 'overdue'

    return {
      id: child.id,
      childName: child.fullName || child.name,
      gender: child.gender,
      birthDate: formatDate(child.birthDate || child.birth_date),
      guardianName: child.guardianName || child.parent?.name || guardian?.fullName || '-',
      guardianPhone: child.guardianPhone || child.parent?.phone || guardian?.phone || '',
      guardianNationalId: child.guardianNationalId || child.parent?.national_id || '',
      qrCode: child.qrCode || child.qr_code || '',
      status
    }
  })
)

const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value
  const q = searchQuery.value.trim()
  return records.value.filter(
    (r) =>
      r.childName.includes(q) ||
      (r.guardianPhone || '').includes(q) ||
      (r.guardianNationalId || '').includes(q) ||
      (r.guardianName || '').includes(q) ||
      (r.qrCode || '').includes(q)
  )
})

const overdueCount = computed(() => records.value.filter((r) => r.status === 'overdue').length)
const completionPercent = computed(() => {
  if (!records.value.length) return 0
  const completed = records.value.filter((r) => r.status === 'completed').length
  return Math.round((completed / records.value.length) * 100)
})
const totalRegistered = computed(() => records.value.length)

const selectedChild = computed(() => childrenStore.getChildById(selectedChildId.value))

function openVaccineCard(childId) {
  selectedChildId.value = childId
  vaccineError.value = ''
}

function closeVaccineCard() {
  selectedChildId.value = null
  vaccineError.value = ''
}

async function handleDeleteChild(row) {
  if (!confirm(`هل أنت متأكد من رغبتك بحذف سجل الطفل ${row.childName}؟\nتنبيه: سيظهر هذا الإجراء في تقارير النظام.`)) return
  try {
    await childrenStore.deleteChild(row.id)
    alert('تم حذف السجل بنجاح')
  } catch (err) {
    alert(err.message || 'حدث خطأ أثناء محاولة الحذف')
  }
}

function doseStatusLabel(status) {
  return { completed: 'مكتملة', overdue: 'متأخرة', upcoming: 'قادمة', cancelled: 'ملغاة' }[status] || status
}

function isDoseSelectable(dateStr) {
  if (!dateStr) return false
  const doseDate = new Date(dateStr)
  const allowDate = new Date(doseDate)
  allowDate.setDate(allowDate.getDate() - 3)
  return new Date() >= allowDate
}

const dosePopupState = ref({
  show: false,
  doseId: null,
  manufacturer: '',
  batchNumber: ''
})

function openDosePopup(doseId) {
  dosePopupState.value = { show: true, doseId, manufacturer: '', batchNumber: '' }
}

function closeDosePopup() {
  dosePopupState.value.show = false
}

async function confirmDoseSubmit() {
  const { doseId, manufacturer, batchNumber } = dosePopupState.value
  if (!manufacturer || !batchNumber) {
    vaccineError.value = 'يرجى إدخال اسم الشركة المصنعة ورقم التشغيلة.'
    return
  }
  
  completingDoseId.value = doseId
  vaccineError.value = ''
  try {
    // Send object with manufacturer and batch_number instead of just notes
    await childrenStore.confirmAttendance(selectedChildId.value, doseId, { manufacturer, batch_number: batchNumber })
    closeDosePopup()
  } catch (err) {
    vaccineError.value = err.message || 'تعذر تسجيل الجرعة'
  } finally {
    completingDoseId.value = null
  }
}

function statusLabel(status) {
  return { completed: 'مكتمل ومغلق', 'in-progress': 'قيد المتابعة', overdue: 'متأخر' }[status] || status
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h1 { margin: 0 0 4px; font-size: 20px; }
.subtitle { margin: 0; font-size: 13px; color: var(--color-text-muted); }

.btn-add {
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.stat-label { margin: 0 0 6px; font-size: 12px; color: var(--color-text-muted); }
.stat-value { margin: 0; font-size: 22px; font-weight: 700; }
.stat-value.danger { color: var(--color-danger); }

.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  flex: 1; display: flex; align-items: center; gap: 8px; 
  border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px;
  background-color: var(--color-card); 
}
.search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text); 
  width: 100%;
}
.search-box input::placeholder {
  color: var(--color-text-muted);
}

.filter-btn, .btn-qr {
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-qr {
  color: var(--color-primary);
  font-size: 18px;
  padding: 8px 12px;
}

.form-error { color: var(--color-danger); font-size: 13px; text-align: center; margin-bottom: 12px; }

/* Dose Popup Styles */
.dose-popup-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dose-popup {
  background: var(--color-white);
  padding: 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 320px;
  border: 1px solid var(--color-border);
}

.dose-popup h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.dose-popup-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.dose-popup-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.dose-popup-actions .btn {
  flex: 1;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.records-table th {
  text-align: right;
  color: var(--color-text-muted);
  font-weight: 500;
  padding-bottom: 10px;
  font-size: 12px;
}

.records-table td {
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
}

.child-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.child-name-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-align: right;
}

.child-name-link:hover { text-decoration: underline; }

.avatar-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.avatar-letter.male { background: #4f8ef7; }
.avatar-letter.female { background: #f472b6; }

.status-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
}

.status-badge.completed { background: #dcfce7; color: #0f766e; }
.status-badge.in-progress { background: #dbeafe; color: #2563eb; }
.status-badge.overdue { background: var(--color-danger-light); color: var(--color-danger); }

.actions-cell {
  display: flex;
  gap: 8px;
}

.actions-cell button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
}

.actions-cell button:hover {
  color: var(--color-primary);
}
.actions-cell .btn-delete:hover {
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

.actions-cell a {
  color: var(--color-text-muted);
  display: inline-flex;
}

.actions-cell a:hover {
  color: var(--color-primary);
}

.vaccine-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.55);
}

.vaccine-modal {
  width: min(720px, 100%);
  max-height: 85vh;
  overflow: auto;
  padding: 24px;
  background: var(--color-card, #fff);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
}

.vaccine-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.vaccine-modal__header h2,
.vaccine-modal__header p { margin: 0; }
.vaccine-modal__header p { margin-top: 5px; color: var(--color-text-muted); font-size: 13px; }
.modal-close { border: 0; background: transparent; color: var(--color-text-muted); font-size: 26px; cursor: pointer; }
.vaccine-dose-list { display: grid; gap: 10px; }
.vaccine-dose-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--color-border); border-radius: 10px; }
.vaccine-dose-row strong, .vaccine-dose-row small { display: block; }
.vaccine-dose-row small { margin-top: 4px; color: var(--color-text-muted); font-size: 12px; }
.dose-status { padding: 4px 8px; border-radius: 6px; font-size: 12px; }
.dose-status.completed { background: #dcfce7; color: #166534; }
.dose-status.overdue { background: #fee2e2; color: #b91c1c; }
.dose-status.upcoming { background: #fef3c7; color: #92400e; }
.dose-status.cancelled { background: #e2e8f0; color: #475569; }
.form-error { margin-bottom: 12px; color: #b91c1c; font-size: 13px; }

@media (max-width: 600px) {
  .vaccine-dose-row { grid-template-columns: 1fr auto; }
  .vaccine-dose-row .btn { grid-column: 1 / -1; }
}
</style>