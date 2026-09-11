<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useAuditStore } from '../../stores/audit'
import { useCentersStore } from '../../stores/centers'
import { useDoctorsStore } from '../../stores/doctors'
import { useChildrenStore } from '../../stores/children'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { ROLES, PERMISSIONS } from '../../stores/permissions'
import { exportCSV, exportPDF } from '../../utils/export'
import { formatNumber, computeTrend } from '../../utils/format'
import { getAdminReportsApi } from '../../utils/api'
import Chart from 'chart.js/auto'

const router = useRouter()
const audit = useAuditStore()
const centersStore = useCentersStore()
const doctorsStore = useDoctorsStore()
const childrenStore = useChildrenStore()
const auth = useAuthStore()
const toast = useToastStore()

const activeTab = ref('reports') // 'reports' | 'oversight'

// بيانات التقارير من السيرفر
const serverData = ref({ totals: {}, coverage_per_center: [], children_report: [], low_stock_warnings: [] })
const isLoading = ref(true)

async function fetchServerReports() {
  isLoading.value = true
  try {
    const res = await getAdminReportsApi()
    const data = res.data || res
    serverData.value = data
  } catch (err) {
    toast.error('خطأ', 'فشل جلب إحصائيات التقارير')
  } finally {
    isLoading.value = false
  }
}

function handleLogout() {
  auth.logout()
  toast.info('تم تسجيل الخروج', 'نراك قريباً 👋')
  router.push({ name: 'login' })
}

const activeCentersLabel = computed(() => formatNumber(serverData.value.totals.centers || centersStore.activeCount))
const regionsFooter = computed(() => `في ${centersStore.regionsCount} مناطق إدارية`)

const coverageRate = computed(() => {
  const t = serverData.value.totals
  if (!t.doses_scheduled || t.doses_scheduled === 0) return childrenStore.coverageRate
  return Math.round((t.doses_completed / t.doses_scheduled) * 100)
})

const registeredChildrenLabel = computed(() => formatNumber(serverData.value.totals.children || childrenStore.totalRegistered))
const registeredTrend = computed(() => computeTrend(childrenStore.registeredThisWeek, childrenStore.registeredPreviousWeek))

const totalVaccinesLabel = computed(() => formatNumber(serverData.value.totals.doses_completed || childrenStore.totalVaccinesAdministered))
const vaccinesTrend = computed(() => computeTrend(childrenStore.vaccinesThisWeek, childrenStore.vaccinesPreviousWeek))

const chartRange = ref('يومي')
const chartCanvas = ref(null)
let chartInstance = null

function currentSeries() {
  return chartRange.value === 'يومي' ? childrenStore.dailySeries(7) : childrenStore.monthlySeries(6)
}

function renderChart() {
  if (!chartCanvas.value) return
  const dataset = currentSeries()
  if (chartInstance) {
    chartInstance.data.labels = dataset.labels
    chartInstance.data.datasets[0].data = dataset.values
    chartInstance.update()
    return
  }
  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: dataset.labels,
      datasets: [{ label: 'عدد الجرعات', data: dataset.values, backgroundColor: '#a9d9c3', hoverBackgroundColor: '#0e6b52', borderRadius: 8, maxBarThickness: 42 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { rtl: true, bodyFont: { family: 'Tajawal' }, titleFont: { family: 'Tajawal' }, callbacks: { label: (ctx) => `${ctx.formattedValue} جرعة` } } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { family: 'Tajawal' } } }, x: { grid: { display: false }, ticks: { font: { family: 'Tajawal' } } } }
    }
  })
}

onMounted(async () => {
  await Promise.all([
    fetchServerReports(),
    audit.fetchAuditLogs()
  ])
  nextTick(renderChart)
})
watch(chartRange, () => nextTick(renderChart))
onBeforeUnmount(() => chartInstance?.destroy())

const reportTypes = [
  'تقرير اللقاحات الشهري',
  'تقرير التسجيل الأسبوعي',
  'تقرير المراكز والتغطية',
  'تقرير أطفال المراكز واللقاحات',
  'تقرير الحالات المنتهية'
]
const selectedReport = ref(reportTypes[3])
const dateFrom = ref(new Date().toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])

// سجل النشاطات المباشر
const recentActivities = computed(() => audit.entries.slice(0, 4))
const activityColors = { login: '#2f7fe0', doctor: '#22b06a', center: '#2bc37a', report: '#7c6ee8', settings: '#93a19c', parents: '#e28743', children: '#e24381', inventory: '#8d43e2' }

// إعدادات سريعة فعالة
const quickSettings = [
  { label: 'إعدادات عامة', action: () => router.push('/admin/settings?tab=general') },
  { label: 'إدارة الصلاحيات (حالة النظام)', action: () => router.push('/admin/settings?tab=security') },
  { label: 'النسخ الاحتياطي', action: () => router.push('/admin/settings?tab=general') }
]

// مراكز اللقاحات: تصنيف ذكي
const centersFilter = ref('active') // 'active', 'overdue'

const topCenters = computed(() => {
  let list = [...serverData.value.coverage_per_center]
  if (centersFilter.value === 'active') {
    list.sort((a, b) => b.coverage_percentage - a.coverage_percentage)
  } else {
    list.sort((a, b) => b.doses_overdue - a.doses_overdue)
  }
  return list.slice(0, 3).map(c => ({
    name: c.center_name,
    coverage: c.coverage_percentage,
    badge: centersFilter.value === 'active' ? 'الأكثر إنجازاً' : 'تحتاج انتباه',
    badgeClass: centersFilter.value === 'active' ? 'badge-success' : 'badge-danger',
    doses: c.doses_completed,
    overdue: c.doses_overdue
  }))
})

function toggleCentersFilter() {
  centersFilter.value = centersFilter.value === 'active' ? 'overdue' : 'active'
}

function reportHeaders() {
  const type = selectedReport.value
  let headers = []
  if (type === 'تقرير المراكز والتغطية') {
    headers = ['اسم المركز', 'عدد الأطفال', 'الجرعات المجدولة', 'المكتملة', 'المتأخرة', 'نسبة التغطية']
  } else if (type === 'تقرير أطفال المراكز واللقاحات') {
    headers = ['اسم الطفل', 'المركز', 'تاريخ الميلاد', 'اللقاحات المعطاة (%)', 'الجرعات المتأخرة', 'الجرعات المتبقية']
  } else if (type === 'تقرير الحالات المنتهية') {
    headers = ['اسم الطفل', 'المركز', 'تاريخ الميلاد', 'الحالة']
  } else {
    // Default fallback
    headers = ['اسم الطبيب', 'المركز', 'الصلاحية', 'البريد الإلكتروني']
  }
  return ['#', ...headers] // دائماً نضيف عمود الترقيم
}

function reportRows() {
  const type = selectedReport.value
  let rows = []
  
  if (type === 'تقرير المراكز والتغطية') {
    rows = serverData.value.coverage_per_center.map(c => [
      c.center_name, c.children_count, c.doses_scheduled, c.doses_completed, c.doses_overdue, c.coverage_percentage + '%'
    ])
  } else if (type === 'تقرير أطفال المراكز واللقاحات') {
    rows = serverData.value.children_report.map(c => [
      c.name, c.center_name, c.birth_date, c.percentage + '%', c.overdue, c.remaining
    ])
  } else if (type === 'تقرير الحالات المنتهية') {
    const completed = serverData.value.children_report.filter(c => c.is_completed)
    rows = completed.map(c => [
      c.name, c.center_name, c.birth_date, 'منتهية (100%)'
    ])
  } else {
    rows = doctorsStore.list.map(d => [d.name, d.center, d.role, d.email])
  }

  // إضافة الترقيم
  return rows.map((row, index) => [index + 1, ...row])
}

function generateReport() {
  audit.log('report', 'تقرير', `تم توليد "${selectedReport.value}" من ${dateFrom.value} إلى ${dateTo.value}`, auth.user?.name)
  toast.success('تم توليد التقرير', `${selectedReport.value} — من ${dateFrom.value} إلى ${dateTo.value}`)
}

function handleExportCSV() {
  exportCSV(selectedReport.value, reportHeaders(), reportRows())
  toast.success('تم التصدير', 'تم تنزيل ملف Excel بنجاح.')
}

function handleExportPDF() {
  exportPDF(selectedReport.value, reportHeaders(), reportRows(), selectedReport.value)
  toast.success('تم التصدير', 'تم تنزيل ملف PDF بنجاح.')
}

/* ------- بيانات تبويب "الإشراف" ------- */
const PERMISSION_LABELS = {
  'doctors.manage': 'إدارة الأطباء',
  'centers.manage': 'إدارة المراكز',
  'reports.export': 'تصدير التقارير',
  'settings.view': 'الوصول للإعدادات',
  'audit.view': 'عرض سجل التدقيق'
}
const roleCounts = { admin: 3, manager: 18, doctor: 132 }
const roles = Object.values(ROLES).map((r) => ({
  name: r.label,
  permissions: (PERMISSIONS[r.key] || []).map((p) => PERMISSION_LABELS[p] || p).join('، ') || 'عرض فقط',
  count: roleCounts[r.key] || 0
}))
const registeredAccounts = computed(() => doctorsStore.total)
</script>

<template>
  <AdminLayout>
    <div class="topbar">
      <div class="tabs">
        <button
          class="tab"
          :class="{ 'tab--active': activeTab === 'oversight' }"
          @click="activeTab = 'oversight'"
        >
          الإشراف
        </button>
        <button
          class="tab"
          :class="{ 'tab--active': activeTab === 'reports' }"
          @click="activeTab = 'reports'"
        >
          التقارير المتقدمة
        </button>
      </div>

      <div class="topbar__actions">
        <button class="icon-btn" aria-label="بحث">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="icon-btn" aria-label="الإشعارات">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="btn btn-outline btn-xs" @click="handleLogout">
          تسجيل الخروج
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M10 8l-4 4 4 4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ============ تبويب: التقارير المتقدمة ============ -->
    <template v-if="activeTab === 'reports'">
      <div class="accent-grid">
        <div class="accent-card" style="--accent: var(--color-danger-600)">
          <p class="accent-card__label">المراكز النشطة</p>
          <p class="accent-card__value">{{ activeCentersLabel }}</p>
          <p class="accent-card__footer">{{ regionsFooter }}</p>
        </div>
        <div class="accent-card" style="--accent: var(--color-green-600)">
          <p class="accent-card__label">نسبة التغطية</p>
          <p class="accent-card__value accent-card__value--green">{{ coverageRate }}%</p>
          <div class="progress"><span :style="{ width: coverageRate + '%' }"></span></div>
        </div>
        <div class="accent-card" style="--accent: var(--color-info-600)">
          <p class="accent-card__label">الأطفال المسجلين</p>
          <p class="accent-card__value">{{ registeredChildrenLabel }}</p>
          <p class="accent-card__footer" :class="{ 'accent-card__footer--up': registeredTrend.type === 'up' }">
            {{ registeredTrend.text }}
          </p>
        </div>
        <div class="accent-card" style="--accent: var(--color-green-800)">
          <p class="accent-card__label">إجمالي اللقاحات</p>
          <p class="accent-card__value">{{ totalVaccinesLabel }}</p>
          <p class="accent-card__footer" :class="{ 'accent-card__footer--up': vaccinesTrend.type === 'up' }">
            {{ vaccinesTrend.text }}
          </p>
        </div>
      </div>

      <!-- إحصائيات المراكز كلوحة تحكم -->
      <section class="card box-pad" style="margin-bottom: 20px;">
        <h2 class="panel__title" style="margin-bottom: 16px;">إحصائيات المراكز والتغطية</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13.5px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">المركز</th>
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">الأطفال</th>
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">المجدولة</th>
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">المكتملة</th>
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">المتأخرة</th>
                <th style="padding: 12px; font-weight: 700; color: var(--color-text-muted);">التغطية</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in serverData.coverage_per_center" :key="c.center_id" style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 12px; font-weight: 600;">{{ c.center_name }}</td>
                <td style="padding: 12px;">{{ c.children_count }}</td>
                <td style="padding: 12px; color: var(--color-info-600);">{{ c.doses_scheduled }}</td>
                <td style="padding: 12px; color: var(--color-green-700); font-weight: 700;">{{ c.doses_completed }}</td>
                <td style="padding: 12px; color: var(--color-danger-600); font-weight: 700;">{{ c.doses_overdue }}</td>
                <td style="padding: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="min-width: 32px; font-weight: 700;">{{ c.coverage_percentage }}%</span>
                    <div style="height: 6px; width: 60px; background: var(--color-surface-muted); border-radius: 999px; overflow: hidden;">
                      <div style="height: 100%; background: var(--color-green-600);" :style="{ width: c.coverage_percentage + '%' }"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="mid-grid">
        <!-- إحصائيات سير العمل -->
        <section class="card chart-panel">
          <div class="chart-panel__head">
            <h2 class="panel__title">إحصائيات سير العمل</h2>
            <div class="range-toggle">
              <button
                :class="{ active: chartRange === 'شهري' }"
                @click="chartRange = 'شهري'"
              >
                شهري
              </button>
              <button
                :class="{ active: chartRange === 'يومي' }"
                @click="chartRange = 'يومي'"
              >
                يومي
              </button>
            </div>
          </div>

          <div class="chart-canvas-wrap">
            <canvas ref="chartCanvas"></canvas>
          </div>

          <div class="chart-footer-cards">
            <div class="mini-card">
              <span class="mini-card__icon mini-card__icon--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <path d="M3 5v5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div>
                <p class="mini-card__label">حالة النظام</p>
                <p class="mini-card__value">
                  <span class="dot" :class="{ 'dot--warning': centersStore.inactiveCount > 0 }"></span>
                  {{ centersStore.inactiveCount > 0 ? 'يحتاج انتباه' : 'يعمل بكفاءة' }}
                </p>
              </div>
            </div>
            <div class="mini-card">
              <span class="mini-card__icon mini-card__icon--info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M3.5 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
              <div>
                <p class="mini-card__label">حسابات الأطباء المسجّلة</p>
                <p class="mini-card__value">{{ registeredAccounts }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- استخراج التقارير -->
        <section class="card export-panel">
          <h2 class="panel__title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.6"/>
              <path d="M3 9h18M8 4v3M16 4v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            استخراج التقارير
          </h2>

          <label class="field-label">نوع التقرير</label>
          <select v-model="selectedReport" class="select">
            <option v-for="r in reportTypes" :key="r" :value="r">{{ r }}</option>
          </select>

          <label class="field-label">الفترة الزمنية</label>
          <div class="date-row">
            <input v-model="dateFrom" type="date" class="select" />
            <input v-model="dateTo" type="date" class="select" />
          </div>

          <button class="btn btn-primary generate-btn" @click="generateReport">
            توليد التقرير
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 12a8 8 0 1 1-2.6-5.9" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
              <path d="M20 4v5h-5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="export-row">
            <button class="btn btn-outline export-half" @click="handleExportCSV">
              تصدير Excel
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/>
                <path d="m8 8 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="btn btn-outline export-half" @click="handleExportPDF">
              تصدير PDF
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M7 3h7l4 4v14H7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M10 13h4M10 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div v-if="serverData.low_stock_warnings?.length" class="alert-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 2 20h20L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="alert-box__title">تنبيه توريد اللقاحات</p>
              <p class="alert-box__desc" v-for="(warn, idx) in serverData.low_stock_warnings" :key="idx">
                {{ warn }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div class="mid-grid mid-grid--reverse">
        <!-- سجل النشاطات + إعدادات سريعة -->
        <section class="card box-pad">
          <h2 class="panel__title activity-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M3 5v5h5M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            سجل النشاطات
          </h2>
          <ul class="activity-list">
            <li v-for="a in recentActivities" :key="a.id" class="activity-row">
              <span class="activity-row__main">
                <span class="activity-dot" :style="{ background: activityColors[a.type] || '#93a19c' }"></span>
                <span class="activity-row__text">{{ a.details }}</span>
              </span>
              <span class="activity-row__time">{{ a.time }}</span>
            </li>
            <li v-if="!recentActivities.length" class="empty-state">لا توجد نشاطات مسجلة بعد</li>
          </ul>

          <div class="section-divider"></div>

          <p class="quick-settings-title">إعدادات النظام السريعة</p>
          <ul class="settings-list">
            <li v-for="s in quickSettings" :key="s.label" @click="s.action" style="cursor: pointer;">
              <span>{{ s.label }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m9 6-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </li>
          </ul>
        </section>

        <!-- مراكز اللقاحات: تصنيف ذكي -->
        <section class="card box-pad">
          <div class="panel__head">
            <h2 class="panel__title">مراكز اللقاحات</h2>
            <button class="icon-btn" aria-label="تصفية" @click="toggleCentersFilter" :class="{'text-primary': centersFilter === 'overdue'}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16l-6 8v6l-4 2v-8L4 5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="center-list">
            <article v-for="c in topCenters" :key="c.name" class="center-item">
              <div class="center-item__body" style="padding-right: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <h3 style="margin: 0; font-size: 15px;">{{ c.name }}</h3>
                  <span class="badge" :class="c.badgeClass">{{ c.badge }}</span>
                </div>
                <div class="center-item__meta" style="margin-top: 10px;">
                  <div>
                    <p class="meta-label">الجرعات المتأخرة</p>
                    <p class="meta-value" style="color: var(--color-danger-600);">{{ c.overdue }} طفل</p>
                  </div>
                  <div>
                    <p class="meta-label">نسبة التغطية</p>
                    <p class="meta-value" style="color: var(--color-green-700);">{{ c.coverage }}%</p>
                  </div>
                </div>
              </div>
            </article>
            <div v-if="!topCenters.length" class="empty-state">لا يوجد بيانات للمراكز حالياً</div>
          </div>
        </section>
      </div>
    </template>

    <!-- ============ تبويب: الإشراف ============ -->
    <template v-else>
      <div class="oversight-status card">
        <div>
          <p class="oversight-status__label">الحالة العامة للنظام</p>
          <p class="oversight-status__value">مستقر ويعمل دون أعطال</p>
        </div>
        <span class="badge badge-success">99.9% وقت تشغيل</span>
      </div>

      <div class="mid-grid">
        <section class="card box-pad">
          <h2 class="panel__title oversight-block-title">الأدوار والصلاحيات</h2>
          <table class="table">
            <thead>
              <tr>
                <th>الدور</th>
                <th>الصلاحيات</th>
                <th>عدد المستخدمين</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in roles" :key="r.name">
                <td class="cell-strong">{{ r.name }}</td>
                <td class="cell-muted">{{ r.permissions }}</td>
                <td>{{ r.count }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="card box-pad">
          <h2 class="panel__title oversight-block-title">النسخ الاحتياطي والأمان</h2>
          <div class="backup-row">
            <div>
              <p class="mini-card__label">آخر نسخة احتياطية</p>
              <p class="mini-card__value">اليوم 03:00 صباحاً</p>
            </div>
            <button class="btn btn-primary btn-xs">تحديث الآن</button>
          </div>
          <ul class="settings-list">
            <li v-for="s in ['المصادقة الثنائية', 'سجل الدخول', 'صلاحيات API']" :key="s">
              <span>{{ s }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m9 6-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </AdminLayout>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 26px;
}

.tabs {
  display: flex;
  gap: 24px;
}

.tab {
  padding-bottom: 10px;
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
}

.tab--active {
  color: var(--color-green-800);
  border-bottom-color: var(--color-green-800);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar__actions .icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
}

/* بطاقات بحاشية ملونة */
.accent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.accent-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px 22px;
  border-inline-end: 4px solid var(--accent);
  box-shadow: var(--shadow-sm);
}

.accent-card__label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 10px;
}

.accent-card__value {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 8px;
}

.accent-card__value--green {
  color: var(--color-green-700);
}

.accent-card__footer {
  font-size: 12px;
  color: var(--color-text-soft);
}

.accent-card__footer--up {
  color: var(--color-green-700);
  font-weight: 700;
}

.progress {
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.progress span {
  display: block;
  height: 100%;
  background: var(--color-green-600);
  border-radius: 999px;
}

/* الشبكة الوسطى */
.mid-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.mid-grid--reverse {
  grid-template-columns: 1fr 1.15fr;
}

.chart-panel,
.export-panel {
  padding: 24px;
}

.chart-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.panel__title {
  font-size: 17px;
  font-weight: 800;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.range-toggle {
  display: flex;
  background: var(--color-surface-muted);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.range-toggle button {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.range-toggle button.active {
  background: var(--color-white);
  color: var(--color-green-800);
  box-shadow: var(--shadow-sm);
}

.chart-canvas-wrap {
  height: 220px;
  margin-bottom: 20px;
}

.chart-footer-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-surface-muted);
  border-radius: 12px;
  padding: 14px;
}

.mini-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mini-card__icon--green {
  background: var(--color-green-100);
  color: var(--color-green-800);
}

.mini-card__icon--info {
  background: var(--color-info-100);
  color: var(--color-info-600);
}

.mini-card__label {
  font-size: 11.5px;
  color: var(--color-text-muted);
  margin-bottom: 3px;
}

.mini-card__value {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-green-600);
  display: inline-block;
}

.dot--warning {
  background: var(--color-warning-600);
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  margin: 16px 0 8px;
}

.select {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  font-size: 13.5px;
  color: var(--color-text);
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.generate-btn {
  width: 100%;
  margin-top: 20px;
}

.export-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.export-half {
  width: 100%;
  font-size: 13px;
  padding: 10px;
}

.alert-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--color-warning-100);
  color: var(--color-warning-600);
  border-radius: 12px;
  padding: 14px;
  margin-top: 18px;
}

.alert-box__title {
  font-weight: 800;
  font-size: 13.5px;
  margin-bottom: 3px;
}

.alert-box__desc {
  font-size: 12.5px;
  line-height: 1.6;
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 4px;
  border-bottom: 1px solid var(--color-border);
}

.activity-row:last-child {
  border-bottom: none;
}

.activity-row__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.activity-row__text {
  font-size: 13.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-row__time {
  font-size: 11.5px;
  color: var(--color-text-soft);
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.activity-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-divider {
  height: 1px;
  background: var(--color-border);
  margin: 18px 0;
}

.quick-settings-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.oversight-block-title {
  margin-bottom: 18px;
}

.box-pad {
  padding: 26px;
}

.settings-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
  border-bottom: 1px solid var(--color-border);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.settings-list li:last-child {
  border-bottom: none;
}


.placeholder-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-green-50);
  color: var(--color-teal-800);
  font-size: 38px;
}

.center-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.center-item {
  display: flex;
  gap: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
}

.center-item__image {
  position: relative;
  width: 112px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.center-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.center-item__badge {
  position: absolute;
  top: 6px;
  right: 6px;
}

.center-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.center-item__body h3 {
  font-size: 14.5px;
  font-weight: 800;
  margin-bottom: 5px;
}

.center-item__loc {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.center-item__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.meta-label {
  font-size: 11px;
  color: var(--color-text-soft);
  margin-bottom: 2px;
}

.meta-value {
  font-size: 12.5px;
  font-weight: 700;
}

.ready-badge {
  font-size: 11px;
  align-self: flex-start;
  margin-top: auto;
}

/* تبويب الإشراف */
.oversight-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.oversight-status__label {
  font-size: 12.5px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.oversight-status__value {
  font-size: 17px;
  font-weight: 800;
}

.backup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface-muted);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.cell-strong {
  font-weight: 700;
}

.cell-muted {
  color: var(--color-text-muted);
}

@media (max-width: 1100px) {
  .accent-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mid-grid,
  .mid-grid--reverse {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .accent-grid {
    grid-template-columns: 1fr;
  }
}
</style>
