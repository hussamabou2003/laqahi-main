<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import StatCard from '../../components/StatCard.vue'
import { useDoctorsStore } from '../../stores/doctors'
import { useCentersStore } from '../../stores/centers'
import { useChildrenStore } from '../../stores/children'
import { useAuditStore } from '../../stores/audit'
import { useInventoryStore } from '../../stores/inventory'
import { useGuardiansStore } from '../../stores/guardians'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatNumber, computeTrend } from '../../utils/format'
import * as XLSX from 'xlsx'
import { getToken } from '../../utils/api'
const doctorsStore = useDoctorsStore()
const centersStore = useCentersStore()
const childrenStore = useChildrenStore()
const inventoryStore = useInventoryStore()
const guardiansStore = useGuardiansStore()
const audit = useAuditStore()
const auth = useAuthStore()
const toast = useToastStore()

onMounted(async () => {
  await Promise.allSettled([
    centersStore.fetchCenters(true),
    doctorsStore.fetchDoctors(),
    childrenStore.fetchAdminChildren(),
    guardiansStore.fetchAdminParents(),
    inventoryStore.fetchInventory(),
    audit.fetchAuditLogs()
  ])
})

const canManage = computed(() => auth.can('doctors.manage'))
const canManageCenters = computed(() => auth.can('centers.manage'))

/* ---------------- الإحصائيات العلوية: محسوبة فعليًا من المتاجر ---------------- */
const systemNeedsAttention = computed(() => centersStore.inactiveCount > 0)

// "إجمالي المستخدمين" = حسابات الأطباء + أولياء أمور الأطفال المسجّلين (تقريب واقعي لعدد مستخدمي المنصة)
const totalUsersLabel = computed(() => formatNumber(doctorsStore.total + guardiansStore.guardians.length))
const totalUsersTrend = computed(() => computeTrend(childrenStore.registeredThisWeek, childrenStore.registeredPreviousWeek))

const totalCentersLabel = computed(() => formatNumber(centersStore.total))
const regionsFooter = computed(() => `في ${centersStore.regionsCount} مناطق إدارية`)

const totalDoctorsLabel = computed(() => formatNumber(doctorsStore.total))
const newDoctorsTrend = computed(() =>
  doctorsStore.newThisMonth > 0 ? `+${doctorsStore.newThisMonth} هذا الشهر` : 'لا جديد هذا الشهر'
)

const centers = computed(() => centersStore.list)
const doctors = computed(() => doctorsStore.list)
const parents = computed(() => guardiansStore.guardians)
const children = computed(() => childrenStore.children)

const activityIcons = { login: 'login', doctor: 'add', center: 'add', report: 'doc', settings: 'doc' }
const activityColors = { login: '#22b06a', doctor: '#2bc37a', center: '#2bc37a', report: '#2f7fe0', settings: '#93a19c' }

const activities = computed(() =>
  audit.entries.slice(0, 3).map((e) => ({
    icon: activityIcons[e.type] || 'doc',
    text: e.details,
    time: e.time,
    color: activityColors[e.type] || '#93a19c'
  }))
)

async function removeDoctor(doctor) {
  try {
    await doctorsStore.remove(doctor.id)
    toast.info('تم تعليق الحساب', `تم حذف/تعليق حساب ${doctor.name}.`)
  } catch (err) {
    toast.error('خطأ', err.message || 'تعذر تعليق الحساب')
  }
}

const settingsLinks = [
  { label: 'إعدادات عامة', tab: 'general' },
  { label: 'إعدادات التنبيهات', tab: 'notifications' },
  { label: 'الأمان والخصوصية', tab: 'security' }
]

const query = ref('')

function exportExcel() {
  if (!audit.entries.length) {
    toast.info('تنبيه', 'لا يوجد سجلات لتصديرها.')
    return
  }
  const data = audit.entries.map(e => ({
    'النشاط': e.details,
    'النوع': e.type,
    'الوقت': e.time,
    'بواسطة': e.user_name || 'غير معروف'
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'سجل النشاط')
  XLSX.writeFile(wb, 'Audit_Log_Laqahi.xlsx')
}

function exportPdf() {
  if (!audit.entries.length) {
    toast.info('تنبيه', 'لا يوجد سجلات لتصديرها.')
    return
  }
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const rows = audit.entries.map(e => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${e.details}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${e.time}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${e.user_name || 'غير معروف'}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>سجل نشاط النظام - لقاحي</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: right; }
          th { background: #1fa15f; color: white; padding: 10px 8px; }
        </style>
      </head>
      <body>
        <h2>سجل نشاط النظام - منصة لقاحي</h2>
        <table>
          <thead>
            <tr><th>النشاط</th><th>الوقت</th><th>بواسطة</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
const isKillingSessions = ref(false)

async function triggerBackup() {
  try {
    toast.info('جاري التجهيز', 'يتم سحب النسخة الاحتياطية من السحابة...')
    const res = await fetch(import.meta.env.VITE_API_URL + '/admin/backup', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    if (!res.ok) throw new Error('فشل النسخ الاحتياطي')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laqahi_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('تم بنجاح', 'تم سحب وحفظ النسخة الاحتياطية لجهازك.')
    audit.log('settings', 'نظام', 'قام مدير النظام بسحب نسخة احتياطية', auth.user?.name)
  } catch (err) {
    toast.error('خطأ', 'فشلت عملية النسخ الاحتياطي')
  }
}
</script>

<template>
  <AdminLayout>
    <!-- شريط علوي: بحث + إشعارات على اليسار، العنوان على اليمين -->
    <div class="topbar">
      <div class="topbar__title">
        <h1 class="page-head__title">لوحة تحكم مدير النظام</h1>
        <p class="page-head__subtitle">مرحباً {{ auth.user?.name || '' }}، إليك ملخص أداء النظام اليوم</p>
      </div>
      <div class="topbar__actions">
        <label class="search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input v-model="query" type="text" placeholder="بحث سريع..." />
        </label>
        <button class="bell" aria-label="الإشعارات">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span class="bell__dot"></span>
        </button>
      </div>
    </div>

    <!-- بطاقات الإحصائيات -->
    <div class="stats-grid">
      <div class="card stat-status">
        <p class="stat-status__label">الحالة العامة للنظام</p>
        <p class="stat-status__value">{{ systemNeedsAttention ? 'يحتاج انتباه' : 'مستقر' }}</p>
        <span class="stat-status__pill">
          <span class="dot" :class="{ 'dot--warning': systemNeedsAttention }"></span>
          {{ systemNeedsAttention ? `${centersStore.inactiveCount} مركز متوقف` : 'تعمل بكفاءة' }}
        </span>
        <svg class="stat-status__deco" width="54" height="54" viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="18" cy="6" r="2" stroke="currentColor" stroke-width="1.4"/>
          <circle cx="12" cy="18" r="2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M7.7 7 10.5 16.5M16.3 7 13.5 16.5M8 6h8" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </div>

      <StatCard
        label="إجمالي المستخدمين"
        :value="totalUsersLabel"
        :trend="totalUsersTrend.text"
        :trend-type="totalUsersTrend.type"
        icon-bg="var(--color-info-100)"
        icon-color="var(--color-info-600)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/>
            <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M16 5.5a3 3 0 0 1 0 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M18 12.5c2.3.4 4 2.4 4 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="عدد المراكز الصحية"
        :value="totalCentersLabel"
        :footer="regionsFooter"
        icon-bg="var(--color-green-50)"
        icon-color="var(--color-green-800)"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" stroke="currentColor" stroke-width="1.7"/>
            <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.7"/>
          </svg>
        </template>
      </StatCard>

      <StatCard
        label="عدد الأطباء النشطين"
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

    <!-- إدارة المراكز والأطباء -->
    <div class="split-grid">
      <section class="card panel">
        <div class="panel__head">
          <h2 class="panel__title">إدارة مراكز اللقاحات</h2>
          <router-link :to="{ path: '/admin/centers', query: { action: 'add' } }" class="btn btn-primary btn-xs" v-if="canManageCenters">+ إضافة مركز</router-link>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>اسم المركز</th>
              <th>الموقع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in centers" :key="c.id">
              <td class="cell-strong">{{ c.name }}</td>
              <td class="cell-muted">{{ c.location }}</td>
              <td>
                <span class="badge" :class="c.status === 'نشط' ? 'badge-success' : 'badge-danger'">
                  {{ c.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card panel">
        <div class="panel__head">
          <h2 class="panel__title">إدارة حسابات الأطباء</h2>
          <router-link v-if="canManage" :to="{ path: '/admin/doctors', query: { action: 'add' } }" class="btn btn-primary btn-xs">+ إضافة طبيب</router-link>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>اسم الطبيب</th>
              <th>البريد الإلكتروني</th>
              <th v-if="canManage">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in doctors" :key="d.id">
              <td class="cell-doctor">
                <span class="avatar" :style="{ background: d.color }">{{ d.initials }}</span>
                {{ d.name }}
              </td>
              <td class="cell-muted">{{ d.email }}</td>
              <td v-if="canManage">
                <div class="row-actions">
                  <button class="icon-btn icon-btn--danger" aria-label="حذف" @click="removeDoctor(d)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <router-link :to="{ path: '/admin/doctors', query: { action: 'edit', id: d.id } }" class="icon-btn" aria-label="تعديل">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                     <path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                     </svg>
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <section class="card panel accounts-summary">
      <div class="panel__head">
        <h2 class="panel__title">الحسابات والسجلات المسجلة</h2>
        <router-link to="/admin/inventory" class="btn btn-outline btn-xs">عرض المخزون</router-link>
      </div>
      <div class="summary-grid">
        <div><strong>{{ parents.length }}</strong><span>أولياء أمور</span></div>
        <div><strong>{{ children.length }}</strong><span>أطفال</span></div>
        <div><strong>{{ inventoryStore.list.length }}</strong><span>سجلات مخزون</span></div>
        <div><strong>{{ inventoryStore.lowStockItems.length }}</strong><span>سجلات منخفضة</span></div>
      </div>
    </section>

    <!-- الإشراف على سير عمل النظام -->
    <section class="card oversight">
      <div class="oversight__head">
        <h2 class="panel__title">الإشراف على سير عمل النظام</h2>
        <p class="page-head__subtitle">سجلات النشاط ونسخ النظام الاحتياطية</p>
      </div>

      <div class="oversight__grid">
        <!-- سجل النشاطات: في أقصى اليمين -->
        <div class="oversight__col">
          <h3 class="activity-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M3 5v5h5M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            سجل النشاطات
          </h3>
          <ul class="activity-list">
            <li v-for="a in activities" :key="a.text">
              <span class="activity-icon" :style="{ background: a.color }">
                <svg v-if="a.icon === 'login'" width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M10 8l-4 4 4 4M6 12h12" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="a.icon === 'add'" width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="8" r="3" stroke="#fff" stroke-width="1.8"/>
                  <path d="M3 20c0-3.3 2.4-5.5 6-5.5M17 8v6M14 11h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M7 3h7l4 4v14H7Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
                  <path d="M10 13h4M10 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="activity-text">
                {{ a.text }}
                <small>{{ a.time }}</small>
              </span>
            </li>
          </ul>
        </div>

        <!-- الإعدادات والنسخ الاحتياطي: في أقصى اليسار -->
        <div class="oversight__col">
          <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 22px;">
            <button @click="exportPdf" class="btn btn-outline export-btn" style="flex: 1; justify-content: center; gap: 8px;">
              تصدير PDF
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
            </button>
            <button @click="exportExcel" class="btn btn-outline export-btn" style="flex: 1; justify-content: center; gap: 8px;">
              تصدير Excel
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 12l4 4m0 -4l-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div class="backup-card">
            <span class="backup-card__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M4 7a8 8 0 1 1 1.5 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                <path d="M4 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <p class="backup-card__label">النسخ الاحتياطي</p>
            <p class="backup-card__status">{{ new Date().toLocaleDateString('ar-SA') }}</p>
            <button class="btn btn-primary btn-xs backup-card__btn" @click="triggerBackup">سحب نسخة الآن</button>
          </div>

          <ul class="settings-list">
            <li v-for="s in settingsLinks" :key="s.tab">
              <router-link v-if="auth.can('settings.view')" :to="`/admin/settings?tab=${s.tab}`" class="settings-list__link">
                <span>{{ s.label }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </router-link>
              <template v-else>
                <span>{{ s.label }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </template>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 14px;
  color: var(--color-text-muted);
  width: 240px;
}

.search input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: var(--color-text);
}

.bell {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.bell__dot {
  position: absolute;
  top: 9px;
  left: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-danger-600);
  border: 2px solid var(--color-white);
}

.stat-status {
  padding: 22px;
  color: #fff;
  background: linear-gradient(150deg, var(--color-green-800), var(--color-green-900));
  position: relative;
  overflow: hidden;
}

.stat-status__label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 10px;
}

.stat-status__value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 14px;
}

.stat-status__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6ee7a8;
}

.dot--warning {
  background: #ffb020;
}

.stat-status__deco {
  position: absolute;
  bottom: 10px;
  left: 10px;
  opacity: 0.35;
}

.split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  padding: 22px;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.panel__title {
  font-size: 17px;
  font-weight: 800;
}

.btn-xs {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 9px;
}

.cell-strong {
  font-weight: 700;
}

.cell-muted {
  color: var(--color-text-muted);
}

.cell-doctor {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-actions {
  display: flex;
  gap: 4px;
}

/* الإشراف */
.oversight {
  padding: 26px;
}

.oversight__head {
  margin-bottom: 22px;
}

.oversight__grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 26px;
}

.oversight__col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.export-btn {
  width: 100%;
  justify-content: space-between;
}

.backup-card {
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  padding: 22px;
  text-align: center;
}

.backup-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-white);
  color: var(--color-green-800);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.backup-card__label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.backup-card__status {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 14px;
}

.backup-card__btn {
  width: 100%;
}

.settings-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.settings-list li:last-child {
  border-bottom: none;
}

.settings-list__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  color: inherit;
}

.settings-list__link:hover {
  color: var(--color-green-800);
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 16px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
  font-weight: 600;
}

.activity-text small {
  font-size: 12px;
  color: var(--color-text-soft);
  font-weight: 500;
}


/* تنسيقات حقول الإدخال في النوافذ المنبثقة */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.form-field label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-muted);
}
.form-field input, .form-field select {
  width: 100%;
  padding: 11px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
}
.form-field input:focus, .form-field select:focus {
  border-color: var(--color-primary);
}

@media (max-width: 1000px) {
  .split-grid,
  .oversight__grid {
    grid-template-columns: 1fr;
  }
}
</style>
