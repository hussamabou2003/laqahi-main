<template>
  <DoctorLayout>
    <div class="page-header">
      <div>
        <h1>تسجيل اللقاحات والتقارير</h1>
        <p class="subtitle">إدارة وتحليل سجلات التحصين للمركز الطبي</p>
      </div>
    </div>

    <div class="dashboard-layout">
      <!-- العمود الأيمن: تسجيل لقاح جديد -->
      <div class="side-column">
        <section class="card register-card h-100">
          <h2>
            <i class="ti ti-syringe"></i> 
            {{ isEditing ? 'تعديل بيانات اللقاح' : 'تسجيل لقاح جديد' }}  
          </h2>
          <form @submit.prevent="handleSaveVaccine" class="register-form">
            <!-- 1. اختيار الطفل -->
            <label class="form-field">
              <span>اختيار الطفل</span>
              <select v-model="form.childId" required>
                <option disabled value="">اختر الطفل</option>
                <option v-for="c in children" :key="c.id" :value="c.id">{{ c.id }} - {{ c.fullName }}</option>
              </select>
            </label>

            <!-- 2. اختيار نوع اللقاح مباشرة من قائمة كافة اللقاحات -->
            <label class="form-field">
              <span>نوع اللقاح</span>
              <select v-model="form.vaccineId" required>
                <option disabled value="">اختر نوع اللقاح</option>
                <optgroup v-for="stage in schedule" :key="stage.stageId" :label="stage.ageText">
                  <option 
                    v-for="v in stage.vaccines" 
                    :key="v.id" 
                    :value="v.id"
                    :disabled="isVaccineDisabled(v.name, stage.ageMonths)"
                  >
                    {{ v.name }} {{ getVaccineStatusText(v.name, stage.ageMonths) ? '- ' + getVaccineStatusText(v.name, stage.ageMonths) : '' }}
                  </option>
                </optgroup>
              </select>
            </label>

            <label class="form-field">
              <span>تاريخ الجرعة</span>
              <input v-model="form.date" type="date" required />
            </label>
            <label class="form-field">
              <span>الوقت (اختياري)</span>
              <input v-model="form.time" type="time" />
            </label>
            <label class="form-field">
              <span>رقم التشغيلة (Batch Number)</span>
              <input v-model.trim="form.batchNumber" type="text" placeholder="مثال: DTP-2026-05-001" required />
            </label>
            <label class="form-field">
              <span>الشركة المصنعة</span>
              <input v-model.trim="form.manufacturer" type="text" placeholder="مثال: GSK / Serum Institute" required />
            </label>
            <label class="form-field">
              <span>المركز الصحي</span>
              <input v-model.trim="form.center" type="text" placeholder="مركز الرعاية الصحية" required />
            </label>
              <div style="display: flex; gap: 10px; margin-top: auto;">
              <button type="submit" class="btn btn-primary" style="flex: 1;">
                {{ isEditing ? 'تحديث بيانات اللقاح' : 'حفظ بيانات اللقاح' }}
              </button>
              <button v-if="isEditing" type="button" class="btn btn-outline" @click="cancelEdit">
                إلغاء 
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- العمود الأيسر: الإحصائيات، التقارير، واللقاحات القادمة -->
      <div class="main-column">
        <section class="stats-row">
          <div class="stat-card">
            <p class="stat-label">المركز الصحي</p>
            <p class="stat-value" style="font-size: 16px; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ stats.centerName }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">نسبة التغطية</p>
            <p class="stat-value">{{ stats.coverage }}%</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">الأطفال المسجلين</p>
            <p class="stat-value">{{ stats.registered.toLocaleString() }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">إجمالي اللقاحات</p>
            <p class="stat-value">{{ stats.totalVaccines.toLocaleString() }}</p>
          </div>
        </section>

        <section class="card reports-card" id="printable-reports">
          <div class="card-header-row">
            <h2>التقارير والإحصائيات</h2>
            <!-- زر تصدير التقرير PDF -->
            <button type="button" class="btn-outline" @click="exportReportToPDF">
              <i class="ti ti-file-download"></i> تصدير تقرير PDF
            </button>
          </div>
          <div class="reports-content">
            <!-- الرسم البياني للأعمدة -->
            <div class="chart-section">
               <p class="chart-title">اللقاحات المعطاة خلال آخر 5 أشهر</p>
               <div class="bar-chart">
                 <div 
                   v-for="(item, i) in monthlyChartData" 
                   :key="i" 
                   class="bar-wrapper"
                   :title="`${item.month}: ${item.count} لقاح`"
                 >
                   <div class="bar" :style="{ height: (item.percentage || 4) + '%' }"></div>
                   <span class="bar-label">{{ item.month }}</span>
                 </div>
               </div>
            </div>

            <!-- الرسم الدائري وأسماء أكثر اللقاحات تسجيلاً -->
            <div class="donut-section">
               <p class="chart-title">أكثر اللقاحات إعطاءً</p>
               <div class="donut" :style="donutStyle">
                 <span class="donut-value">{{ stats.totalVaccines }}</span>
                 <span class="donut-label">جرعة معطاة</span>
               </div>
               <!-- قائمة الأسماء الأكثر تكراراً تلقائياً -->
               <ul class="legend">
                 <li v-for="cat in vaccineCategories" :key="cat.name">
                   <span class="dot" :style="{ background: cat.color }"></span> 
                   {{ cat.name }} ({{ cat.percentage }}%)
                 </li>
               </ul>
            </div>
          </div>
        </section>

        <section class="card upcoming-section">
          <div class="card-header-row">
            <h2>جدول اللقاحات القادم</h2>
          </div>

          <div v-if="allUpcoming.length" class="upcoming-container">
            <div class="upcoming-grid-cards">
              <div v-for="dose in paginatedUpcoming" :key="dose.id" class="mini-upcoming-card">
                <div class="mini-card-info">
                  <p class="mini-child-name">{{ dose.childName }}</p>
                  <div class="mini-badge-vaccine">لقاح {{ dose.name }}</div>
                  <p class="mini-date-time"><i class="ti ti-clock"></i> {{ formatDate(dose.date) }} - {{ dose.time }}</p>
                </div>
                <div class="mini-actions">
                  <button @click="editUpcomingDose(dose)" class="mini-action-btn edit" title="تعديل">
                    <i class="ti ti-pencil"></i>
                  </button>
                  <button @click="deleteUpcomingDose(dose)" class="mini-action-btn delete" title="حذف">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="totalUpcomingPages > 1" class="pagination">
              <button @click="upcomingPage--" :disabled="upcomingPage === 1" aria-label="السابق">
                <i class="ti ti-chevron-right"></i>
              </button>
              <span v-for="p in totalUpcomingPages" :key="p" @click="upcomingPage = p" :class="{ active: upcomingPage === p }">
                {{ p }}
              </span>
              <button @click="upcomingPage++" :disabled="upcomingPage === totalUpcomingPages" aria-label="التالي">
                <i class="ti ti-chevron-left"></i>
              </button>
            </div>
          </div>
          <div v-else class="no-data">
            لا توجد مواعيد لقاحات مجدولة قادمة
          </div>
        </section>
      </div>
    </div>



    <!-- السجل اليومي -->
    <section class="card bottom-card">
      <div class="search-row">
        <h2>سجل اللقاحات المعطاة اليوم</h2>
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input v-model="searchQuery" type="text" placeholder="بحث باسم أو رقم التشغيلة..." />
          <i class="ti ti-filter"></i>
        </div>
      </div>
      <div class="table-responsive">
        <table class="records-table">
          <thead>
            <tr>
              <th>اسم الطفل</th>
              <th>نوع اللقاح</th>
              <th>رقم التشغيلة</th>
              <th>الوقت</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paginatedTodayLog" :key="row.id">
              <td>{{ row.childName }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.batchNumber || '-' }}</td>
              <td>{{ row.time || '-' }}</td>
              <td><span class="status-badge" :class="row.status">{{ statusLabel(row.status) }}</span></td>
              <td class="actions-cell">
                <button type="button" aria-label="طباعة"><i class="ti ti-printer"></i></button>
                <button type="button" aria-label="عرض"><i class="ti ti-eye"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="paginatedTodayLog.length === 0" class="no-data">لا توجد سجلات متطابقة</div>
      </div>

      <div v-if="totalTodayPages > 1" class="pagination table-pagination">
        <button @click="todayPage--" :disabled="todayPage === 1" aria-label="السابق">
          <i class="ti ti-chevron-right"></i>
        </button>
        <span v-for="p in totalTodayPages" :key="p" @click="todayPage = p" :class="{ active: todayPage === p }">
          {{ p }}
        </span>
        <button @click="todayPage++" :disabled="todayPage === totalTodayPages" aria-label="التالي">
          <i class="ti ti-chevron-left"></i>
        </button>
      </div>
    </section>


  </DoctorLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import { useChildrenStore } from '../../stores/children'
import { useAvailabilityStore } from '../../stores/availability'
import { useCentersStore } from '../../stores/centers'
import { VACCINE_SCHEDULE, getPreciseAge } from '../../stores/vaccines'
import { useVaccinesStore } from '../../stores/vaccines'
import { useAuthStore } from '../../stores/auth'
import { useNotificationsStore } from '../../stores/notifications'
const registerCardRef = ref(null) 
const centersStore = useCentersStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()
const vaccinesStore = useVaccinesStore()
const availabilityStore = useAvailabilityStore()
const schedule = VACCINE_SCHEDULE

const children = computed(() => childrenStore.children)
const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const form = reactive({
  childId: '',
  vaccineId: '',
  date: todayStr,
  time: '',
  batchNumber: '',
  manufacturer: '',
  center: ''
})

// مراقبة اختيار الطفل وملء حقل المركز الصحي تلقائياً
watch(() => form.childId, (newChildId) => {
  if (!newChildId) {
    form.center = ''
    form.vaccineId = ''
    return
  }

  const selectedChild = childrenStore.children.find(c => c.id === newChildId)
  if (selectedChild) {
    const upcomingDose = (selectedChild.doses || []).find(d => d.status === 'upcoming' || d.status === 'overdue')
    form.center = upcomingDose?.place || selectedChild.preferredCenter || selectedChild.center || 'مركز الرعاية الصحية الرئيسي'
    
    if (form.vaccineId) {
      const selectedVaccine = allVaccinesList.value.find(v => v.id === form.vaccineId)
      if (selectedVaccine && isVaccineDisabled(selectedVaccine.name, selectedVaccine.stageAgeMonths)) {
        form.vaccineId = ''
      }
    }
  }
})

// مصفوفة مسطحة تجمع كافة اللقاحات مع اسم المرحلة التابعة لها
const allVaccinesList = computed(() => {
  return schedule.flatMap(stage => 
    stage.vaccines.map(v => ({
      ...v,
      dbId: vaccinesStore.list.find(item => item.name === v.name)?.id,
      stageId: stage.stageId,
      stageAgeText: stage.ageText,
      stageAgeMonths: stage.ageMonths
    }))
  )
})

function isVaccineDisabled(vaccineName, stageAgeMonths) {
  if (!form.childId) return false
  const child = childrenStore.children.find(c => c.id === form.childId)
  if (!child) return false

  // 1. Check if vaccine is already completed
  const hasTaken = (child.doses || []).some(d => d.name === vaccineName && d.status === 'completed')
  if (hasTaken) return true

  // 2. Check if child's age is suitable for the vaccine
  const age = getPreciseAge(child.birthDate)
  if (age && age.months < stageAgeMonths) {
    return true
  }

  return false
}

function getVaccineStatusText(vaccineName, stageAgeMonths) {
  if (!form.childId) return ''
  const child = childrenStore.children.find(c => c.id === form.childId)
  if (!child) return ''

  const hasTaken = (child.doses || []).some(d => d.name === vaccineName && d.status === 'completed')
  if (hasTaken) return 'تم إعطاؤه'

  const age = getPreciseAge(child.birthDate)
  if (age && age.months < stageAgeMonths) {
    return 'العمر غير مناسب'
  }

  return ''
}

onMounted(async () => {
  await Promise.all([childrenStore.fetchDoctorChildren(), vaccinesStore.fetchVaccines()])
})

// 1. حساب الإحصائيات العامة ونسبة التغطية ديناميكياً
const stats = computed(() => {
  const allDoses = childrenStore.getAllDosesFlat || []
  const totalChildren = childrenStore.children.length
  
  const totalExpectedDosesPerChild = schedule.reduce((sum, stage) => sum + stage.vaccines.length, 0)
  const totalExpectedAll = totalChildren * totalExpectedDosesPerChild

  const completedDosesCount = allDoses.filter(d => d.status === 'completed').length

  const coveragePercent = totalExpectedAll > 0 
    ? Math.round((completedDosesCount / totalExpectedAll) * 100) 
    : 0

  return {
    centerName: authStore.currentUser?.centerName || authStore.currentUser?.center?.name || 'المركز الصحي',
    coverage: coveragePercent,
    registered: totalChildren,
    totalVaccines: completedDosesCount
  }
})

// 2. حساب بيانات الرسم البياني للأعمدة (توزيع الجرعات عبر آخر 5 أشهر)
const monthlyChartData = computed(() => {
  const allDoses = childrenStore.getAllDosesFlat || []
  const months = []
  const now = new Date()

  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthName = d.toLocaleDateString('ar-SA', { month: 'short' })
    months.push({ key: monthKey, month: monthName, count: 0 })
  }

  allDoses.forEach(dose => {
    if (dose.status === 'completed' && dose.date) {
      const doseMonth = dose.date.substring(0, 7)
      const found = months.find(m => m.key === doseMonth)
      if (found) found.count++
    }
  })

  const maxCount = Math.max(...months.map(m => m.count), 1)

  return months.map(m => ({
    ...m,
    percentage: Math.round((m.count / maxCount) * 100)
  }))
})

// 3. تصنيف اللقاحات الأكثر إعطاءً ديناميكياً
const PALETTE_COLORS = ['#0f766e', '#3b82f6', '#f59e0b', '#8b5cf6', '#cbd5e1']

const vaccineCategories = computed(() => {
  const completedDoses = (childrenStore.getAllDosesFlat || []).filter(d => d.status === 'completed')
  const total = completedDoses.length

  if (total === 0) {
    return [
      { name: 'لا توجد بيانات', count: 0, percentage: 0, color: '#cbd5e1' }
    ]
  }

  const countsMap = {}
  completedDoses.forEach(dose => {
    const vName = (dose.name || 'غير محدد').trim()
    countsMap[vName] = (countsMap[vName] || 0) + 1
  })

  const sortedList = Object.entries(countsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const top3 = sortedList.slice(0, 3)
  const remaining = sortedList.slice(3)
  const remainingCount = remaining.reduce((sum, item) => sum + item.count, 0)

  const result = top3.map((item, index) => ({
    name: item.name,
    count: item.count,
    percentage: Math.round((item.count / total) * 100),
    color: PALETTE_COLORS[index]
  }))

  if (remainingCount > 0) {
    result.push({
      name: 'أخرى',
      count: remainingCount,
      percentage: Math.round((remainingCount / total) * 100),
      color: PALETTE_COLORS[3]
    })
  }

  return result
})

// 4. توليد تدرج الرسم الدائري (مرة واحدة فقط)
const donutStyle = computed(() => {
  const cats = vaccineCategories.value
  if (!cats.length || cats[0].count === 0) {
    return { background: '#e2e8f0' }
  }

  let currentAngle = 0
  const gradientParts = []

  cats.forEach(cat => {
    const nextAngle = currentAngle + (cat.percentage * 3.6)
    gradientParts.push(`${cat.color} ${currentAngle}deg ${nextAngle}deg`)
    currentAngle = nextAngle
  })

  return { background: `conic-gradient(${gradientParts.join(', ')})` }
})


// 5. دالة تصدير وطباعة تقرير PDF الخاصة بالطبيب
function exportReportToPDF() {
  const totalChildren = stats.value.registered
  const totalVaccines = stats.value.totalVaccines
  const coverage = stats.value.coverage
  const centerName = stats.value.centerName
  const printDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })

  const topVaccinesRows = vaccineCategories.value
    .map(v => `<tr><td>${v.name}</td><td>${v.count}</td><td>${v.percentage}%</td></tr>`)
    .join('')

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  
  // إضافة تحقق للتأكد من أن المتصفح لم يحظر النافذة المنبثقة
  if (!printWindow) {
    window.alert('تعذّر فتح نافذة التصدير. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير اللقاحات والإحصائيات</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { color: #0f766e; margin: 0 0 8px 0; font-size: 24px; }
        .header p { color: #64748b; margin: 0; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
        .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; background: #f8fafc; }
        .stat-box .title { font-size: 13px; color: #64748b; margin-bottom: 6px; }
        .stat-box .val { font-size: 20px; font-weight: bold; color: #0f766e; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 14px; }
        th { background-color: #0f766e; color: #ffffff; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 40px; text-align: left; font-size: 12px; color: #94a3b8; }
        @media print {
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير المؤشرات والإحصائيات الطبية</h1>
        <p>تاريخ استخراج التقرير: ${printDate}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-box"><div class="title">إجمالي الأطفال</div><div class="val">${totalChildren}</div></div>
        <div class="stat-box"><div class="title">إجمالي اللقاحات المعطاة</div><div class="val">${totalVaccines}</div></div>
        <div class="stat-box"><div class="title">نسبة التغطية</div><div class="val">${coverage}%</div></div>
        <div class="stat-box"><div class="title">المركز الصحي</div><div class="val" style="font-size: 16px;">${centerName}</div></div>
      </div>

      <h3>توزيع أكثر اللقاحات تسجيلاً:</h3>
      <table>
        <thead>
          <tr>
            <th>اسم اللقاح</th>
            <th>عدد الجرعات المعطاة</th>
            <th>النسبة من الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${topVaccinesRows}
        </tbody>
      </table>

      <div class="footer">
        <p>تم استخراج هذا التقرير آلياً من نظام إدارة اللقاحات</p>
      </div>
      
      <!-- السكربت الداخلي للطباعة التلقائية -->
      <script>
        setTimeout(() => {
          window.focus();
          window.print();
          window.close(); // اختياري: إغلاق النافذة بعد الطباعة
        }, 400);
      <\\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

// 6. السجلات اليومية والجدول
const todayLog = computed(() =>
  childrenStore.getAllDosesFlat
    .filter((d) => d.date === todayStr && d.status === 'completed')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
)

const searchQuery = ref('')
const filteredLog = computed(() => {
  if (!searchQuery.value) return todayLog.value
  const q = searchQuery.value.toLowerCase()
  return todayLog.value.filter(
    (r) => (r.childName || '').toLowerCase().includes(q) || (r.batchNumber || '').toLowerCase().includes(q)
  )
})

const todayPage = ref(1)
const todayPerPage = 5
const totalTodayPages = computed(() => Math.ceil(filteredLog.value.length / todayPerPage) || 1)

const paginatedTodayLog = computed(() => {
  const start = (todayPage.value - 1) * todayPerPage
  return filteredLog.value.slice(start, start + todayPerPage)
})

watch(searchQuery, () => {
  todayPage.value = 1
})

const allUpcoming = computed(() =>
  childrenStore.getAllDosesFlat
    .filter((d) => d.status === 'upcoming' && d.date > todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
)

const upcomingPage = ref(1)
const upcomingPerPage = 3
const totalUpcomingPages = computed(() => Math.ceil(allUpcoming.value.length / upcomingPerPage) || 1)

const paginatedUpcoming = computed(() => {
  const start = (upcomingPage.value - 1) * upcomingPerPage
  return allUpcoming.value.slice(start, start + upcomingPerPage)
})

function statusLabel(status) {
  return { completed: 'مكتمل', upcoming: 'مجدولة', overdue: 'متأخر' }[status] || status
}

const notificationsStore = useNotificationsStore()
const isEditing = ref(false)
const editingDoseId = ref(null)


// دالة إلغاء التعديل وتفريغ الحقول
function cancelEdit() {
  isEditing.value = false
  editingDoseId.value = null
  Object.assign(form, { childId: '', vaccineId: '', date: todayStr, time: '', batchNumber: '', manufacturer: '', center: '' })
}

// دالة حذف الموعد وإرسال إشعار
function deleteUpcomingDose(dose) {
  if (confirm(`هل أنت متأكد من حذف موعد اللقاح (${dose.name}) للطفل ${dose.childName}؟`)) {
    // 1. تنفيذ الحذف من متجر الأطفال
    childrenStore.deleteDose(dose.childId, dose.id)
    
    // 2. إنشاء إشعار الحذف لكي يظهر في قسم الإشعارات والمواعيد
    const deleteNotification = {
      id: Date.now(),
      createdAt: Date.now(),
      type: 'error', 
      title: 'إلغاء وحذف موعد لقاح',
      desc: `تم حذف وإلغاء موعد لقاح (${dose.name}) للطفل ${dose.childName} بنجاح.`
    }
    
    if (notificationsStore.addNotification) {
      notificationsStore.addNotification(deleteNotification)
    } else {
      if (!notificationsStore.items) notificationsStore.items = []
      notificationsStore.items.unshift(deleteNotification)
      if (notificationsStore.saveToStorage) notificationsStore.saveToStorage()
    }
    
    if (isEditing.value && editingDoseId.value === dose.id) {
      cancelEdit()
    }
  }
}

function editUpcomingDose(dose) {
  isEditing.value = true
  editingDoseId.value = dose.id
  
  const vaccineObj = allVaccinesList.value.find(v => v.name === dose.name)
  
  form.childId = dose.childId
  form.vaccineId = vaccineObj ? vaccineObj.id : ''
  form.date = dose.date || todayStr
  form.time = dose.time || ''
  form.batchNumber = dose.batchNumber || ''
  form.manufacturer = dose.manufacturer || ''
  form.center = dose.center || ''

  // التمرير السلس وإضافة تأثير الوميض المؤقت لنموذج التعديل
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  const cardElement = document.querySelector('.register-card')
  if (cardElement) {
    cardElement.classList.add('pulse-highlight')
    setTimeout(() => {
      cardElement.classList.remove('pulse-highlight')
    }, 1500)
  }
}

async function handleSaveVaccine() {
  if (!form.childId || !form.vaccineId) {
    alert('يرجى اختيار الطفل ونوع اللقاح')
    return
  }

  // 1. تحديد الوقت
  const now = new Date()
  const currentFormattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const doseTime = form.time ? form.time : currentFormattedTime

  // 2. البحث عن اللقاح
  const selectedVaccine = allVaccinesList.value.find(v => v.id === form.vaccineId)
  const vaccineName = selectedVaccine ? selectedVaccine.name : form.vaccineId
  const stageId = selectedVaccine ? selectedVaccine.stageId : 'general'

  if (!selectedVaccine?.dbId) {
    alert('تعذر ربط اللقاح ببيانات النظام، يرجى تحديث الصفحة والمحاولة مجددًا')
    return
  }

  // 3. تحديد الحالة
  let finalStatus = 'completed'
  if (form.date > todayStr) {
    finalStatus = 'upcoming'
  } else if (form.date === todayStr && form.time) {
    const [formHour, formMinute] = form.time.split(':').map(Number)
    if (formHour > now.getHours() || (formHour === now.getHours() && formMinute > now.getMinutes())) {
      finalStatus = 'upcoming'
    }
  }

  // 4. تجهيز حزمة البيانات
  const payload = {
    stageId: stageId,
    vaccineId: selectedVaccine.dbId,
    name: vaccineName,
    date: form.date,
    time: doseTime,
    batchNumber: form.batchNumber,
    manufacturer: form.manufacturer,
    center: form.center,
    status: finalStatus
  }

  // 5. التفريق بين وضع التعديل ووضع الإضافة
  if (isEditing.value) {
    // ---- حالة التحديث (تعديل موعد) ----
    await childrenStore.updateDose(form.childId, editingDoseId.value, payload)
    
    // إرسال إشعار بتحديث الموعد
    const newNotification = {
      id: Date.now(),
      createdAt: Date.now(),
      type: 'info', // أيقونة زرقاء
      title: 'تحديث بيانات موعد',
      desc: `تم تحديث بيانات موعد لقاح (${vaccineName}) للطفل إلى تاريخ ${form.date} الساعة ${doseTime}.`
    }
    if (notificationsStore.addNotification) notificationsStore.addNotification(newNotification)
    
    alert('تم تحديث بيانات اللقاح بنجاح!')
    cancelEdit() // إلغاء وضع التعديل وتفريغ الحقول
    
  } else {
    // ---- حالة الإضافة (موعد جديد) ----
    await childrenStore.addDoseToChild(form.childId, payload)
    // تفريغ الحقول فقط بعد الإضافة الناجحة
    Object.assign(form, { childId: '', vaccineId: '', date: todayStr, time: '', batchNumber: '', manufacturer: '', center: '' })
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })
}


</script>

<style scoped>
:root {
  --teal-primary: #0f766e;
  --teal-light: #ccfbf1;
}

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h1 { margin: 0 0 6px; font-size: 22px; color: var(--color-text); font-weight: bold; }
.subtitle { margin: 0; font-size: 14px; color: #64748b; }

.btn-add {
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: 600;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 2.2fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch;
}

.side-column { display: flex; flex-direction: column; }
.main-column { display: flex; flex-direction: column; gap: 20px; }

.h-100 { height: 100%; display: flex; flex-direction: column; }
.register-form { display: flex; flex-direction: column; flex-grow: 1; }
.mt-auto { margin-top: auto; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 16px; text-align: center; }
.stat-label { margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 500; }
.stat-value { margin: 0; font-size: 24px; font-weight: 700; color: var(--color-teal-700); }


.card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.card h2 { font-size: 16px; margin: 0 0 16px; color: var(--color-teal-700); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.reports-content { display: flex; gap: 30px; align-items: center; justify-content: space-around; }
.chart-title { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 16px; }
.chart-section { flex: 1; }
.donut-section { flex: 1; display: flex; flex-direction: column; align-items: center; }

.bar-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 120px; gap: 12px; }
.bar { width: 30px; background: #99f6e4; border-radius: 4px 4px 0 0; }
.bar:nth-child(even) { background: #cbd5e1; }
.bar:nth-child(3) { background: #64748b; }

.donut {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 16px;
}

.donut::before { content: ''; position: absolute; inset: 16px; background: var(--color-card); border-radius: 50%; }
.donut-value { position: relative; z-index: 1; font-size: 20px; font-weight: 700; color: var(--color-teal-700); }
.donut-label { position: relative; z-index: 1; font-size: 11px; color: #64748b; }

.legend { list-style: none; padding: 0; margin: 0; display: flex; gap: 12px; font-size: 12px; justify-content: center; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 4px; }
.dot.dtp { background: #0f766e; }
.dot.opv { background: #3b82f6; }
.dot.bcg { background: #22c55e; }
.dot.other { background: #cbd5e1; }

.btn-outline { border: 1px solid #e2e8f0; background: #f8fafc; padding: 6px 12px; border-radius: 6px; font-size: 12px; color: #64748b; cursor: pointer; }

.flex-grow { flex-grow: 1; display: flex; flex-direction: column; }
.upcoming-container { display: flex; flex-direction: column; flex-grow: 1; }
.upcoming-cards-row { display: flex; gap: 16px; flex-grow: 1; align-items: flex-start; }
.upcoming-card { flex: 1; background: var(--color-surface-muted); border-right: 4px solid var(--color-teal-700); border-radius: 6px; padding: 12px; }
.upcoming-child { margin: 0 0 6px; font-weight: 600; font-size: 13px; color: var(--color-text); }
.upcoming-vaccine { margin: 0 0 6px; font-size: 12px; color: #475569; }
.upcoming-date-time { margin: 0; font-size: 11px; color: #64748b; }

.form-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-bottom: 12px; color: #475569; }
.form-field input, .form-field select { border: 1px solid var(--color-border); background: var(--color-bg); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: var(--color-text); outline: none; }
.form-field input:focus, .form-field select:focus { border-color: #0f766e; }
.optgroup { font-weight: 700; color: #0f766e; }

.full-width-rect { margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }


.pagination {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 16px;
  align-items: center;
}
.pagination button {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pagination button:disabled { color: #cbd5e1; cursor: not-allowed; }
.pagination span {
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  transition: all 0.2s;
}
.pagination span:hover { background: #e2e8f0; }
.pagination span.active { background: #0f766e; color: white; font-weight: bold; pointer-events: none; }

.table-pagination { margin-top: 20px; }

.search-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px; min-width: 300px; background: var(--color-bg); }
.search-box input { border: none; background: transparent; outline: none; flex: 1; font-size: 13px; }

.table-responsive { overflow-x: auto; min-height: 250px; } 
.records-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: right; }
.records-table th { color: var(--color-teal-700); font-weight: 600; padding: 12px 8px; border-bottom: 2px solid var(--color-border); }
.records-table td { padding: 14px 8px; border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); }

.status-badge { font-size: 11px; padding: 4px 12px; border-radius: 12px; font-weight: 500; }
.status-badge.completed { background: #ccfbf1; color: #0f766e; }
.actions-cell button { background: none; border: none; cursor: pointer; color: #64748b; margin-left: 8px; font-size: 16px; }
.no-data { text-align: center; color: #64748b; padding: 20px 0; font-size: 14px; flex-grow: 1; display: flex; align-items: center; justify-content: center; }

@media (max-width: 1024px) {
  .dashboard-layout { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .availability-content { flex-direction: column; align-items: stretch; gap: 16px; }
  .availability-form { flex-wrap: wrap; }
  .horizontal-slots { justify-content: flex-start; }
}
@media (max-width: 768px) {
  .reports-content { flex-direction: column; }
  .upcoming-cards-row { flex-direction: column; }
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 6px;
}
.bar-label {
  font-size: 10px;
  color: #64748b;
}
.legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap; 
  gap: 10px;
  font-size: 12px;
  justify-content: center;
  max-width: 260px;
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-outline:hover {
  background: #e2e8f0;
  color: #0f766e;
}

.upcoming-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;}

.upcoming-section .no-data {
  padding: 15px 0 !important;
  margin: 0 !important;
  font-size: 13px;
  color: #64748b;
}

.upcoming-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; 
}

.upcoming-grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  max-height: 180px;
  overflow-y: auto;
}

/* تنسيقات أزرار التعديل والحذف في جدول المواعيد */
.upcoming-actions {
  display: flex;
  gap: 8px;
}

.upcoming-actions .icon-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  font-size: 16px;
}

.upcoming-actions .edit-btn:hover { 
  background: #dbeafe; 
  color: #2563eb; 
}

.upcoming-actions .delete-btn:hover { 
  background: #fee2e2; 
  color: #ef4444; 
}


/* تنسيق شبكة البطاقات المصغرة للمواعيد القادمة */
.upcoming-grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.mini-upcoming-card {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.2s ease;
}

.mini-upcoming-card:hover {
  border-color: #0f766e;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.mini-card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mini-child-name {
  margin: 0;
  font-size: 14.5px;
  font-weight: 800; /* اسم الطفل أصبح عريضاً وبارزاً */
  color: var(--color-text);
}

.mini-badge-vaccine {
  background: var(--color-surface-muted);
  color: #0f766e;
  font-size: 11.5px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.mini-date-time {
  margin: 0;
  font-size: 11.5px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-action-btn {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
  transition: 0.2s;
}

.mini-action-btn.edit:hover {
  background: #dbeafe;
  color: #2563eb;
  border-color: #bfdbfe;
}

.mini-action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fecaca;
}

@keyframes pulseBorder {
  0% { border-color: #0f766e; box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.2); }
  100% { border-color: var(--color-border); box-shadow: none; }
}

.register-card.pulse-highlight {
  animation: pulseBorder 1.5s ease-in-out;
}

</style>