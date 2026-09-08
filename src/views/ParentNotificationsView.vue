<template>
  <DashboardLayout>
    <div class="page-header">
      <div class="header-text">
        <h1>مركز الإشعارات</h1>
        <p class="subtitle">تنبيهات أخذ اللقاح، المواعيد، ورسائل الطبيب</p>
      </div>

      <div class="header-controls">
        <button @click="markAllAsRead" class="btn-clear" :disabled="!unreadCount">
          <i class="ti ti-check-all"></i> تحديد الكل كمقروء
        </button>
      </div>
    </div>

    <section class="card tabs-card">
      <div class="tabs-content">
        <div v-if="notificationsStore.loading" style="text-align: center; padding: 20px;">
          <i class="ti ti-loader spinning" style="font-size: 24px;"></i>
          <p>جاري تحميل الإشعارات...</p>
        </div>
        
        <ul v-else-if="displayedNotifications.length" class="notif-list-full">
          <li v-for="n in displayedNotifications" :key="n.id" class="notif-item-full" :class="{ unread: !n.is_read }">
            <div class="notif-icon-large">
              <i v-if="n.type === 'manual'" class="ti ti-stethoscope" style="color: #2563eb;"></i>
              <i v-else-if="n.type === 'auto'" class="ti ti-calendar-event" style="color: #f59e0b;"></i>
              <i v-else class="ti ti-bell" style="color: #16a34a;"></i>
            </div>
            <div class="notif-details" @click="markAsRead(n)">
              <p class="notif-title">
                {{ n.type === 'manual' ? 'تنبيه من الطبيب' : 'تحديث النظام' }}
                <span v-if="n.child" class="child-badge">{{ n.child.name }}</span>
              </p>
              <p class="notif-desc">{{ n.message }}</p>
            </div>
            <div class="notif-actions">
              <div class="notif-time">{{ formatDate(n.sent_at || n.createdAt) }}</div>
              <button v-if="!n.is_read" class="btn-mark-read" @click="markAsRead(n)" title="تحديد كمقروء">
                <i class="ti ti-circle-check"></i>
              </button>
            </div>
          </li>
        </ul>
        <div v-else class="no-data-box">
          <i class="ti ti-bell-off"></i>
          <p>لا توجد إشعارات حالياً.</p>
        </div>
      </div>
    </section>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useNotificationsStore } from '../stores/notifications'

const notificationsStore = useNotificationsStore()

onMounted(async () => {
  await notificationsStore.fetchParentNotifications()
})

const displayedNotifications = computed(() => {
  return [...notificationsStore.items].sort((a, b) => {
    const timeA = new Date(a.sent_at || a.createdAt).getTime()
    const timeB = new Date(b.sent_at || b.createdAt).getTime()
    return timeB - timeA
  })
})

const unreadCount = computed(() => notificationsStore.unreadCount)

async function markAsRead(notification) {
  if (notification.is_read || !notification.id) return
  await notificationsStore.markRead(notification.id)
}

async function markAllAsRead() {
  await notificationsStore.markAllRead()
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
.btn-clear { display: flex; align-items: center; gap: 6px; background: #e0f2fe; color: #0284c7; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-clear:hover:not(:disabled) { background: #bae6fd; }
.btn-clear:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; color: #94a3b8; }

.card { background: var(--color-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
.tabs-content { padding: 24px; min-height: 400px; }

.notif-list-full { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.notif-item-full { display: flex; gap: 16px; align-items: center; padding: 20px; border-radius: 12px; background: var(--color-surface-muted); border: 1px solid var(--color-border); transition: 0.3s; position: relative; }
.notif-item-full.unread { background: #f0fdf4; border-color: #bbf7d0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

.notif-icon-large { width: 48px; height: 48px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; border: 1px solid var(--color-border); }
.notif-details { flex: 1; cursor: pointer; }
.notif-title { margin: 0 0 6px; font-size: 15px; font-weight: 700; color: var(--color-text); display: flex; align-items: center; gap: 8px; }
.child-badge { background: #e2e8f0; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
.notif-desc { margin: 0; font-size: 13.5px; color: #64748b; line-height: 1.6; }

.notif-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.notif-time { font-size: 12px; font-weight: 600; color: #94a3b8; background: #fff; padding: 6px 12px; border-radius: 20px; border: 1px solid var(--color-border); }
.btn-mark-read { background: transparent; border: none; color: #16a34a; cursor: pointer; font-size: 20px; padding: 0; transition: transform 0.2s; }
.btn-mark-read:hover { transform: scale(1.1); }

.no-data-box { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; color: #94a3b8; gap: 12px; }
.no-data-box i { font-size: 48px; opacity: 0.5; }

@keyframes spin { 100% { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; display: inline-block; }
</style>
