<template>
  <DoctorLayout>
    <div class="page-header">
      <div class="header-text">
        <h1>مركز الإشعارات</h1>
        <p class="subtitle">متابعة كافة التنبيهات، تحديثات النظام، وتغييرات المواعيد</p>
      </div>
      
      <!-- أدوات التحكم: فلتر التاريخ وزر المسح -->
      <div class="header-controls">
        <div class="date-filter-box">
          <label>عرض حسب التاريخ:</label>
          <input type="date" v-model="filterDate" class="date-input" />
          <button v-if="filterDate" @click="filterDate = ''" class="clear-date" title="إلغاء الفلتر"><i class="ti ti-x"></i></button>
        </div>
        
        <button @click="clearNotifications" class="btn-clear" :disabled="!displayedNotifications.length">
          <i class="ti ti-trash"></i> مسح الإشعارات
        </button>
      </div>
    </div>

    <section class="card tabs-card">
      <div class="tabs-header">
        <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">جميع الإشعارات</button>
        <button class="tab-btn" :class="{ active: activeTab === 'appointments' }" @click="activeTab = 'appointments'">إشعارات المواعيد</button>
      </div>

      <div class="tabs-content">
        <ul v-if="displayedNotifications.length" class="notif-list-full">
          <li v-for="n in displayedNotifications" :key="n.id" class="notif-item-full">
            <div class="notif-icon-large"><i class="ti ti-bell" :class="n.type || 'info'"></i></div>
            <div class="notif-details">
              <p class="notif-title">{{ n.title }}</p>
              <p class="notif-desc">{{ n.desc }}</p>
            </div>
            <div class="notif-time">{{ formatDate(n.createdAt) }}</div>
          </li>
        </ul>
        <div v-else class="no-data-box">
          <i class="ti ti-bell-off"></i>
          <p>لا توجد إشعارات مطابقة حالياً.</p>
        </div>
      </div>
    </section>
  </DoctorLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import { useNotificationsStore } from '../../stores/notifications'
import { useChildrenStore } from '../../stores/children'

const notificationsStore = useNotificationsStore()
const childrenStore = useChildrenStore()
const activeTab = ref('all')
const filterDate = ref('') // متغير لحفظ التاريخ المختار

const allNotifications = computed(() => {
  const doseNotifications = childrenStore.getAllDosesFlat
    .filter((d) => d.createdAt)
    .map((d) => ({
      id: d.id,
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

  // الترتيب التنازلي الحاسم للأحدث في الأعلى
  return [...doseNotifications, ...storeNotifications]
    .sort((a, b) => b.createdAt - a.createdAt)
})

const displayedNotifications = computed(() => {
  let list = allNotifications.value

  // 1. فلترة حسب التبويب
  if (activeTab.value === 'appointments') {
    list = list.filter(n => n.title.includes('موعد') || n.desc.includes('موعد') || n.title.includes('جدولة'))
  }

  // 2. فلترة حسب التاريخ المختار
  if (filterDate.value) {
    list = list.filter(n => {
      if (!n.createdAt) return false
      // تحويل وقت الإشعار إلى صيغة YYYY-MM-DD للمقارنة
      const nDate = new Date(n.createdAt).toLocaleDateString('en-CA') 
      return nDate === filterDate.value
    })
  }

  return list
})

function clearNotifications() {
  if (confirm('هل أنت متأكد من مسح الإشعارات الإدارية؟ (ملاحظة: السجل الطبي للجرعات لن يُمسح)')) {
    // تفريغ الإشعارات الإدارية وحفظ التغيير
    notificationsStore.items = []
    if (notificationsStore.saveToStorage) {
      notificationsStore.saveToStorage()
    }
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'الآن'
  const date = new Date(timestamp)
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.header-text h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: var(--color-text); }
.subtitle { margin: 0; font-size: 14px; color: var(--color-text-muted); }

.header-controls { display: flex; gap: 12px; align-items: center; }
.date-filter-box { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--color-border); padding: 6px 12px; border-radius: 8px; font-size: 13px; color: #64748b; }
.date-input { border: none; outline: none; font-family: inherit; font-size: 13px; cursor: pointer; color: var(--color-text); }
.clear-date { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 0 4px; }

.btn-clear { display: flex; align-items: center; gap: 6px; background: #fee2e2; color: #ef4444; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-clear:hover:not(:disabled) { background: #fecaca; }
.btn-clear:disabled { opacity: 0.5; cursor: not-allowed; }

.card { background: var(--color-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
.tabs-header { display: flex; border-bottom: 1px solid var(--color-border); background: var(--color-surface-muted); }
.tab-btn { flex: 1; padding: 16px; background: transparent; border: none; border-bottom: 3px solid transparent; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { background: #f8fafc; color: var(--color-teal-700); }
.tab-btn.active { color: var(--color-teal-700); border-bottom-color: var(--color-teal-700); background: var(--color-card); }
.tabs-content { padding: 24px; min-height: 400px; }
.notif-list-full { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.notif-item-full { display: flex; gap: 16px; align-items: center; padding: 20px; border-radius: 12px; background: var(--color-surface-muted); border: 1px solid var(--color-border); transition: 0.3s; }
.notif-icon-large { width: 48px; height: 48px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 1px solid var(--color-border); }
.notif-icon-large i.success { color: #16a34a; }
.notif-details { flex: 1; }
.notif-title { margin: 0 0 6px; font-size: 15px; font-weight: 700; color: var(--color-text); }
.notif-desc { margin: 0; font-size: 13.5px; color: #64748b; line-height: 1.5; }
.notif-time { font-size: 12px; font-weight: 600; color: #94a3b8; background: #fff; padding: 6px 12px; border-radius: 20px; border: 1px solid var(--color-border); }
.no-data-box { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; color: #94a3b8; gap: 12px; }
.no-data-box i { font-size: 48px; opacity: 0.5; }
</style>