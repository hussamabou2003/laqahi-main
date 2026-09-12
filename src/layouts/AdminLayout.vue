<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useToastStore } from '../stores/toast'
import { ROUTE_ROLES } from '../stores/permissions'
import LogoIcon from '../components/LogoIcon.vue'
import ToastContainer from '../components/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const toast = useToastStore()

const navItems = computed(() => {
  const items = [
    { to: '/admin/dashboard', label: 'لوحة التحكم', match: 'admin-dashboard', icon: 'grid' },
    { to: '/admin/doctors', label: 'إدارة الأطباء', match: 'admin-doctors', icon: 'doctors' },
    { to: '/admin/centers', label: 'مراكز اللقاحات', match: 'admin-centers', icon: 'pin' },
    { to: '/admin/inventory', label: 'مخزون اللقاحات', match: 'admin-inventory', icon: 'box' },
    { to: '/admin/reports', label: 'التقارير', match: 'admin-reports', icon: 'chart' },
    { to: '/admin/backup', label: 'النسخ الاحتياطي', match: 'admin-backup', icon: 'backup' }
  ]
  if (auth.user && ROUTE_ROLES.audit.includes(auth.user.role)) {
    items.push({ to: '/admin/audit', label: 'سجل النشاطات', match: 'admin-audit', icon: 'audit' })
  }
  return items
})

const showSettingsLink = computed(() => auth.user && ROUTE_ROLES.settings.includes(auth.user.role))

async function handleLogout() {
  await auth.performLogout()
  toast.info('تم تسجيل الخروج', 'نراك قريباً 👋')
  router.push({ name: 'login' })
}

</script>

<template>
  <div class="admin">
    <div class="admin__body">
      <aside class="sidebar">
        <div class="sidebar__top">

<div class="sidebar__top-row">
  <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: var(--color-teal-800);">
    <LogoIcon size="28" />
    <span>لقاحي</span>
  </div>
  <button class="theme-toggle" :aria-label="theme.dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'" @click="theme.toggle()">
    <i :class="theme.dark ? 'ti ti-sun' : 'ti ti-moon'" style="font-size: 18px;"></i>
  </button>
</div>

<div class="sidebar__user">
  <span class="sidebar__avatar" style="background: var(--color-teal-800);">
    <i class="ti ti-shield-check" style="font-size: 20px;"></i>
  </span>
  <div class="sidebar__user-info">
    <p class="sidebar__user-name">{{ auth.user?.name || 'مدير النظام' }}</p>
    <p class="sidebar__user-role">مدير النظام</p>
  </div>
</div>
        </div>

        <nav class="sidebar__nav">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': route.name === item.match }"
          >
            <span class="sidebar__link-icon">
              <svg v-if="item.icon === 'grid'" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.7"/>
                <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.7"/>
                <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.7"/>
                <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.7"/>
              </svg>
              <svg v-else-if="item.icon === 'doctors'" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/>
                <path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                <path d="M16 5.5a3 3 0 0 1 0 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                <path d="M18 12.5c2.3.4 4 2.4 4 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="item.icon === 'pin'" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" stroke="currentColor" stroke-width="1.7"/>
                <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.7"/>
              </svg>
              <svg v-else-if="item.icon === 'audit'" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M14 3v4a1 1 0 0 0 1 1h4M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
                <path d="M9 17h6M9 13h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="item.icon === 'backup'" width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M12 16V4M8 8l4-4 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            {{ item.label }}
          </router-link>

          <template v-if="showSettingsLink">
            <div class="sidebar__divider"></div>
            <router-link to="/admin/settings" class="sidebar__link" :class="{ 'sidebar__link--active': route.name === 'settings' }">
            <span class="sidebar__link-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/>
                  <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.55 1h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                </svg>
              </span>
              إعدادات النظام
            </router-link>
          </template>
        </nav>

        <button class="sidebar__logout" @click="handleLogout">
          تسجيل الخروج
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 8l-4 4 4 4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </aside>

      <!-- المحتوى الرئيسي -->
      <main class="admin__content">
        <slot/>
      </main>
    </div>

    <!-- 2. وضع مكون الإشعارات هنا لكي يظهر أعلى يسار الشاشة دائماً -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin__body {
  display: flex;
  flex: 1;
}

.admin__content {
  flex: 1;
  padding: 32px 36px;
  min-width: 0;
}

/* ---------- الشريط الجانبي ---------- */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--color-white);
  border-left: 1px solid var(--color-border);
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.theme-toggle {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-toggle:hover {
  color: var(--color-green-800);
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}

.sidebar__user-info {
  min-width: 0;
}

.sidebar__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.sidebar__user-name {
  font-weight: 700;
  font-size: 14.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__user-role {
  font-size: 12px;
  color: var(--color-text-muted);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  margin-top: 20px;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar__link:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.sidebar__link--active {
  background: var(--color-green-800);
  color: #fff;
  box-shadow: 0 6px 16px rgba(14, 107, 82, 0.28);
}

.sidebar__link-icon {
  display: inline-flex;
}

.sidebar__divider {
  height: 1px;
  background: var(--color-border);
  margin: 12px 4px;
}

.sidebar__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 13px;
  border-radius: 12px;
  background: var(--color-danger-100);
  color: var(--color-danger-600);
  font-weight: 700;
  font-size: 14px;
  width: 100%;
}

.sidebar__logout:hover {
  filter: brightness(0.96);
}



@media (max-width: 1100px) {
  .admin__body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    flex-wrap: wrap;
    border-left: none;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar__top {
    margin-bottom: 0;
    width: 100%;
  }

  .sidebar__user {
    margin-top: 16px;
  }

  .sidebar__nav {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }

  .sidebar__divider {
    display: none;
  }

  .sidebar__logout {
    margin-top: 16px;
  }

  .admin__content {
    padding: 24px 18px;
  }
}
</style>
