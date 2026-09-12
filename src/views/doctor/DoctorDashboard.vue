<template>
  <DoctorLayout>
    <div class="page-header">
      <div class="header-text">
        <h1>لوحة التحكم</h1>
        <p class="welcome-text">مرحبًا {{ authStore.currentUser?.fullName }}، إليك ملخص نشاطك اليوم</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper" :class="{ 'is-active': isSearchActive }">
          <input 
            v-show="isSearchActive" 
            ref="searchInput"
            type="text" 
            class="search-input" 
            placeholder="ابحث عن طفل أو موعد..." 
            @blur="isSearchActive = false"
            @keydown.enter="isSearchActive = false; $router.push('/doctor/children')"
          />
          <button type="button" class="icon-btn" aria-label="بحث" @click="toggleSearch">
            <i class="ti ti-search"></i>
          </button>
        </div>
        
        <!-- غلاف الجرس مع النقطة الحمراء -->
        <router-link to="/doctor/notifications" class="icon-btn notif-bell-wrapper" aria-label="الإشعارات">
          <i class="ti ti-bell"></i>
          <!-- تظهر النقطة فقط إذا كان هناك إشعارات -->
          <span v-if="notifications.length > 0" class="notif-dot"></span>
        </router-link>
      </div>

    </div>

    <section class="stats-row">
      <div class="stat-card">
        <div class="stat-top">
          <div class="icon-wrapper"><i class="ti ti-users"></i></div>
          <span v-if="stats.totalChildren > 0" class="badge success">+نشط</span>
        </div>
        <div class="stat-bottom">
          <p class="stat-label">إجمالي الأطفال المسجلين</p>
          <p class="stat-value">{{ stats.totalChildren.toLocaleString() }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="icon-wrapper"><i class="ti ti-vaccine"></i></div>
        </div>
        <div class="stat-bottom">
          <p class="stat-label">اللقاحات المعطاة اليوم</p>
          <p class="stat-value">{{ stats.vaccinesToday }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="icon-wrapper"><i class="ti ti-calendar"></i></div>
        </div>
        <div class="stat-bottom">
          <p class="stat-label">المواعيد القادمة</p>
          <p class="stat-value">{{ stats.upcomingAppointments }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="icon-wrapper"><i class="ti ti-building-hospital"></i></div>
          <span class="badge active">مركزي</span>
        </div>
        <div class="stat-bottom">
          <p class="stat-label">المركز الصحي</p>
          <p class="stat-value" style="font-size: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ stats.centerName }}</p>
        </div>
      </div>
    </section>

    <!-- التخطيط الرئيسي -->
    <div class="dashboard-grid">
      
      <!-- العمود الأيمن -->
      <div class="main-column">
        <!-- الرسم البياني -->
        <section class="card chart-card">
          <div class="card-header-row">
            <h2>إحصائيات اللقاحات خلال 7 أيام</h2>
            <div class="range-toggle">
               <button type="button" :class="{ active: range === 'daily' }" @click="range = 'daily'">يومي</button>
               <button type="button" :class="{ active: range === 'weekly' }" @click="range = 'weekly'">أسبوعي</button>
            </div>
          </div>
          <div class="bar-chart-container">
            <div class="bar-chart">
              <div v-for="(item, i) in chartData" :key="i" class="bar-column">
                <span class="bar-count" v-if="item.count > 0">{{ item.count }}</span>
                <div class="bar" :style="{ height: (item.count / maxCount) * 100 + '%' }"></div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- مواعيد اليوم -->
        <section ref="appointmentsSection" class="card appointments-card">
          <div class="card-header-row">
            <h2>مواعيد اليوم</h2>
          </div>
          <table class="appointments-table">
            <thead>
              <tr>
                <th>اسم الطفل</th>
                <th>ولي الأمر</th>
                <th>الوقت</th>
                <th>اللقاح</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in todayAppointments" :key="a.id">
                <td class="child-cell">
                  {{ a.childName }}
                  <i v-if="a.confirmedByParent" class="ti ti-circle-check confirmed-icon" title="أكدت الأم حضورها"></i>
                </td>
                <td>{{ a.guardianName }}</td>
                <td>{{ a.time }}</td>
                <td><span class="vaccine-tag">{{ a.vaccine }}</span></td>
                <td>
                  <div class="custom-select-wrapper">
                    <select 
                      :value="a.status" 
                      @change="updateStatus(a, $event.target.value)"
                      class="status-select"
                      :class="a.status"
                    >
                      <option value="upcoming">قيد المتابعة</option>
                      <option value="completed">مكتمل</option>
                      <option value="overdue">متأخر</option>
                    </select>
                  </div>
                </td>
              </tr>
              <tr v-if="!todayAppointments.length">
                <td colspan="5" class="no-data">لا توجد مواعيد أو لقاحات مسجّلة اليوم</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <div class="side-column">
        <!-- الإشعارات -->
        <section class="card notifications-card">
          <div class="card-header-row">
            <div style="display: flex; gap: 8px; align-items: center;">
              <h2>أحدث الإشعارات</h2>
              <span v-if="notifications.length" class="badge active">{{ notifications.length }} إشعار</span>
            </div>
            <!-- زر رؤية المزيد الذي يوجه لصفحة الإشعارات -->
            <router-link to="/doctor/notifications" class="view-all">رؤية المزيد</router-link>
          </div>

          <ul v-if="notifications.length" class="notif-list">
            <li v-for="n in notifications" :key="n.id" class="notif-item highlight">
              <div class="notif-icon"><i class="ti ti-check" :class="n.type"></i></div>
              <div class="notif-content">
                <p class="notif-title">{{ n.title }}</p>
                <p class="notif-desc">{{ n.desc }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="no-data">لا توجد إشعارات حاليًا</p>
        </section>

        <section class="card donut-card">
          <h2>توزيع الحالات</h2>
          <div class="donut-wrapper">
            <div class="donut" :style="donutStyle">
              <span class="donut-value">{{ caseDistribution.completedPct }}%</span>
              <span class="donut-label">مكتملة</span>
            </div>
          </div>
          <ul class="legend">
            <li><span><span class="dot done"></span> مكتملة</span> <span>{{ caseDistribution.completedPct }}%</span></li>
            <li><span><span class="dot pending"></span> قائمة</span> <span>{{ caseDistribution.upcomingPct }}%</span></li>
            <li><span><span class="dot overdue"></span> متأخرة</span> <span>{{ caseDistribution.overduePct }}%</span></li>
          </ul>
        </section>
      </div>
      
    </div>
  </DoctorLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { useChildrenStore } from '../../stores/children'
import { useGuardiansStore } from '../../stores/guardians'
import { useNotificationsStore } from '../../stores/notifications'
import { useCentersStore } from '../../stores/centers'

const statusOverrides = ref({}) 
const centersStore = useCentersStore()
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const childrenStore = useChildrenStore()
const guardiansStore = useGuardiansStore()

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const isSearchActive = ref(false)
const searchInput = ref(null)

function toggleSearch() {
  isSearchActive.value = !isSearchActive.value
  if (isSearchActive.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const stats = computed(() => {
  const allDoses = childrenStore.getAllDosesFlat
  return {
    centerName: authStore.currentUser?.centerName || authStore.currentUser?.center?.name || 'المركز الصحي',
    upcomingAppointments: allDoses.filter((d) => d.status === 'upcoming' || d.status === 'overdue').length,
    vaccinesToday: allDoses.filter((d) => d.date === todayStr && d.status === 'completed').length,
    totalChildren: childrenStore.children.length
  }
})

const notifications = computed(() => {
  const doseNotifications = childrenStore.getAllDosesFlat
    .filter((d) => d.createdAt)
    .map((d) => ({
      id: d.id,
      // تأكيد تحويل وقت الإنشاء إلى رقم زمني صحيح للمقارنة السليمة
      createdAt: new Date(d.createdAt).getTime() || d.createdAt,
      type: 'success',
      title: 'تم تسجيل لقاح جديد',
      desc: `تم تسجيل جرعة ${d.name} للطفل ${d.childName}`
    }))

  const storeNotifications = (notificationsStore.items || []).map(n => ({
    ...n,
    title: n.title || 'إشعار من النظام',
    desc: n.desc || n.message || '',
    createdAt: new Date(n.sent_at || n.createdAt).getTime() || n.createdAt || n.sent_at
  }))

  // دمج القائمتين وترتيبهما من الأحدث (الأكبر رقمياً) إلى الأقدم
  return [...doseNotifications, ...storeNotifications]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20) 
})

const range = ref('weekly')
const weeklyData = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('ar-SA', { weekday: 'short' })
    const count = childrenStore.getAllDosesFlat.filter(
      (dose) => dose.date === dateStr && dose.status === 'completed'
    ).length
    days.push({ label, count })
  }
  return days
})

const dailyData = computed(() => {
  const todayDoses = childrenStore.getAllDosesFlat.filter(
    (dose) => dose.date === todayStr && dose.status === 'completed' && dose.createdAt
  )
  const periods = [
    { label: '12–4ص', start: 0, end: 4 },
    { label: '4–8ص', start: 4, end: 8 },
    { label: '8–12م', start: 8, end: 12 },
    { label: '12–4م', start: 12, end: 16 },
    { label: '4–8م', start: 16, end: 20 },
    { label: '8–12م', start: 20, end: 24 }
  ]
  return periods.map((p) => ({
    label: p.label,
    count: todayDoses.filter((dose) => {
      const hour = new Date(dose.createdAt).getHours()
      return hour >= p.start && hour < p.end
    }).length
  }))
})

const chartData = computed(() => (range.value === 'weekly' ? weeklyData.value : dailyData.value))
const maxCount = computed(() => Math.max(1, ...chartData.value.map((d) => d.count)))

const caseDistribution = computed(() => {
  const allDoses = childrenStore.getAllDosesFlat
  const total = allDoses.length || 1 
  const completed = allDoses.filter((d) => d.status === 'completed').length
  const upcoming = allDoses.filter((d) => d.status === 'upcoming').length
  const overdue = allDoses.filter((d) => d.status === 'overdue').length

  return {
    completedPct: Math.round((completed / total) * 100),
    upcomingPct: Math.round((upcoming / total) * 100),
    overduePct: Math.round((overdue / total) * 100)
  }
})

const donutStyle = computed(() => {
  const { completedPct, upcomingPct } = caseDistribution.value
  return {
    background: `conic-gradient(#16a34a 0% ${completedPct}%, #3b82f6 ${completedPct}% ${completedPct + upcomingPct}%, #ef4444 ${completedPct + upcomingPct}% 100%)`
  }
})

const todayAppointments = computed(() =>
  childrenStore.getAllDosesFlat
    .filter((d) => d.date === todayStr)
    .map((d) => {
      const child = childrenStore.getChildById(d.childId)
      const guardian = guardiansStore.guardians.find((g) => g.nationalId === child?.guardianNationalId)
      return {
        id: d.id,
        childId: d.childId,
        doseId: d.id,
        childName: d.childName,
        guardianName: guardian?.fullName || '-',
        time: d.time || '-',
        vaccine: d.name,
        status: statusOverrides.value[d.id] || d.effectiveStatus || d.status,
        confirmedByParent: d.confirmedByParent
      }
    })
)

async function updateStatus(appointment, newStatus) {
  const previousStatus = appointment.status
  statusOverrides.value = { ...statusOverrides.value, [appointment.doseId]: newStatus }

  const child = childrenStore.children.find(c => String(c.id) === String(appointment.childId));
  if (child && child.doses) {
    const doseIndex = child.doses.findIndex(d => String(d.id) === String(appointment.doseId));
    if (doseIndex !== -1) {
      child.doses[doseIndex].status = newStatus;
      child.doses[doseIndex].effectiveStatus = newStatus;
      child.doses = [...child.doses];
    }
  }

  try {
    if (newStatus === 'completed') {
      await childrenStore.confirmAttendance(appointment.childId, appointment.doseId);
    } else {
      await childrenStore.updateDose(appointment.childId, appointment.doseId, {
        status: newStatus === 'overdue' ? 'booked' : 'booked',
        date: appointment.date || todayStr,
        time: appointment.time
      });
    }

    const statusLabels = { completed: 'مكتمل', upcoming: 'قيد المتابعة', overdue: 'متأخر' };
    const typeIcons = { completed: 'success', upcoming: 'info', overdue: 'error' };

    const newNotification = {
      id: Date.now(),
      createdAt: Date.now(),
      type: typeIcons[newStatus] || 'info',
      title: 'تحديث حالة الإجراء',
      desc: `تم تغيير حالة لقاح (${appointment.vaccine}) للطفل ${appointment.childName} إلى: ${statusLabels[newStatus] || newStatus}`
    };

    if (notificationsStore.addNotification) {
      notificationsStore.addNotification(newNotification);
    } else {
      if (!notificationsStore.items) notificationsStore.items = [];
      notificationsStore.items.unshift(newNotification);
    }
  } catch (err) {
    statusOverrides.value = { ...statusOverrides.value, [appointment.doseId]: previousStatus }
    if (child && child.doses) {
      const doseIndex = child.doses.findIndex(d => String(d.id) === String(appointment.doseId));
      if (doseIndex !== -1) {
        child.doses[doseIndex].status = previousStatus;
        child.doses[doseIndex].effectiveStatus = previousStatus;
        child.doses = [...child.doses];
      }
    }
    alert(err.message || 'حدث خطأ أثناء تحديث حالة الجرعة')
  }
}
const appointmentsSection = ref(null)
function scrollToAppointments() {
  nextTick(() => {
    appointmentsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  setTimeout(() => {
    uiStore.highlightAppointments = false
  }, 1800)
}

onMounted(async () => {
  await Promise.allSettled([
    childrenStore.fetchDoctorChildren(),
    notificationsStore.fetchDoctorNotifications(),
    centersStore.fetchCenters()
  ])
  if (uiStore.highlightAppointments) scrollToAppointments()
})

watch(() => uiStore.highlightAppointments, (val) => {
  if (val) scrollToAppointments()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-text { display: flex; flex-direction: column; color: var(--color-text); }
.page-header h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: var(--color-text); }
.welcome-text { margin: 0; font-size: 13px; color: var(--color-text-muted); }

.header-actions { display: flex; gap: 12px; }
.icon-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 18px; }

.search-wrapper { display: flex; align-items: center; background: #fff; border: 1px solid transparent; border-radius: 20px; transition: all 0.3s ease; height: 40px; }
.search-wrapper.is-active { border-color: #e2e8f0; }
.search-wrapper .icon-btn { border: none; background: transparent; }
.search-input { border: none; background: transparent; padding: 0 12px; width: 180px; font-family: inherit; font-size: 13px; color: var(--color-text); outline: none; }
.search-input::placeholder { color: #94a3b8; }

.custom-select-wrapper { position: relative; display: inline-block; }
.status-select {
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  font-size: 12px; padding: 6px 16px 6px 32px; border-radius: 20px;
  border: 1px solid transparent; font-family: inherit; font-weight: 600;
  cursor: pointer; outline: none; text-align: right; transition: all 0.2s ease;
  background-color: #f1f5f9; color: #64748b;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: left 10px center; background-size: 14px;
}
.status-select.upcoming { background-color: #dbeafe; color: #2563eb; border-color: #bfdbfe; } 
.status-select.completed { background-color: #dcfce7; color: #16a34a; border-color: #bbf7d0; } 
.status-select.overdue { background-color: #fee2e2; color: #ef4444; border-color: #fecaca; } 
.status-select option { background-color: #fff; color: #1e293b; font-weight: 500; }

.confirmed-icon { color: var(--color-primary); font-size: 13px; margin-right: 4px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { background: var(--color-card); border-radius: 16px; padding: 20px; border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 16px; }
.stat-top { display: flex; justify-content: space-between; align-items: flex-start; }
.icon-wrapper { background: #ccfbf1; color: #0f766e; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
.badge.success { background: #dcfce7; color: #16a34a; }
.badge.active { background: #ccfbf1; color: #0f766e; }
.stat-bottom { text-align: right; }
.stat-label { margin: 0 0 4px; font-size: 13px; color: #64748b; }
.stat-value { margin: 0; font-size: 28px; font-weight: 700; color: var(--color-text); }
.dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
.main-column { display: flex; flex-direction: column; gap: 20px; }
.side-column { display: flex; flex-direction: column; gap: 20px; }

.card { background: var(--color-card); border-radius: 16px; padding: 24px; border: 1px solid var(--color-border); }
.card-header-row h2 { font-size: 16px; margin: 0; color: var(--color-text); font-weight: 700; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.view-all { font-size: 12px; color: #0f766e; font-weight: 600; }

.range-toggle { display: flex; background: #f1f5f9; border-radius: 20px; padding: 4px; gap: 4px; }
.range-toggle button { border: none; background: transparent; padding: 6px 16px; border-radius: 16px; font-size: 12px; color: #64748b; cursor: pointer; font-weight: 500; }
.range-toggle button.active { background: #0f766e; color: #fff; }
.bar-chart-container { background: var(--color-surface-muted); border-radius: 12px; padding: 20px; height: 220px; display: flex; align-items: flex-end; }
.bar-chart { display: flex; align-items: flex-end; justify-content: space-around; width: 100%; height: 100%; gap: 15px; }
.bar-column { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.bar-count { font-size: 11px; color: var(--color-primary); margin-bottom: 4px; font-weight: bold; }
.bar-label { font-size: 11px; color: #64748b; margin-top: 8px; white-space: nowrap; }
.bar { width: 30px; background: #81cec1; border-radius: 6px 6px 0 0; }
.bar-column:nth-child(1) .bar { background: #0f766e; }

.appointments-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.appointments-table th, .appointments-table td { text-align: right; padding: 16px 12px; }
.appointments-table th { color: var(--color-teal-700); font-weight: 600; border-bottom: 2px solid var(--color-border); }
.appointments-table td { border-bottom: 1px solid var(--color-border); color: var(--color-text-muted); }
.child-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; color: var(--color-text); }
.appointments-table td.child-cell { border-bottom: 1px solid #f1f5f9 !important; display: table-cell; vertical-align: middle; }
.vaccine-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }


.notif-list { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  padding: 0; 
  margin: 0; 
  list-style: none;
  max-height: 280px; 
  overflow-y: auto;  
  padding-right: 4px; 
}

.notif-list::-webkit-scrollbar {
  width: 5px;
}
.notif-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.notif-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.notif-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.notif-bell-wrapper { position: relative; }
.notif-dot { 
  position: absolute; 
  top: 8px; 
  right: 10px; 
  width: 9px; 
  height: 9px; 
  background-color: #ef4444; 
  border-radius: 50%; 
  border: 2px solid #fff; 
}


.notif-item { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border-radius: 12px; background: var(--color-card); border: 1px solid var(--color-border); transition: 0.3s; }
.notif-item.highlight { background: var(--color-surface-muted); }
.notif-icon { background: var(--color-card); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border); flex-shrink: 0; }
.notif-icon i.success { color: #16a34a; }
.notif-icon i.error { color: #ef4444; }
.notif-icon i.info { color: #2563eb; }
.notif-title { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: var(--color-text); }
.notif-desc { margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.5; }

.donut-wrapper { display: flex; justify-content: center; margin: 20px 0; }
.donut { width: 160px; height: 160px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; transition: all 0.3s ease; }
.donut::before { content: ''; position: absolute; inset: 20px; background: var(--color-card); border-radius: 50%; }
.donut-value { position: relative; z-index: 1; font-size: 28px; font-weight: 700; color: var(--color-text); }
.donut-label { position: relative; z-index: 1; font-size: 12px; color: #64748b; }
.legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; font-size: 13px; }
.legend li { display: flex; justify-content: space-between; align-items: center; color: #475569; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 8px; }
.dot.done { background: #16a34a; }
.dot.pending { background: #3b82f6; }
.dot.overdue { background: #ef4444; }

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .dashboard-grid { grid-template-columns: 1fr; }
}
</style>