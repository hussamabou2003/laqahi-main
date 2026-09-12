<template>
  <aside class="sidebar-card-container">

    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 8px 6px;">
  <div class="logo" style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: var(--color-teal-800); padding:0;">
    <LogoIcon size="28" />
    <span>لقاحي</span>
  </div>
  <button class="theme-toggle" :aria-label="theme.dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'" @click="theme.toggle()">
    <i :class="theme.dark ? 'ti ti-sun' : 'ti ti-moon'" style="font-size: 18px;"></i>
  </button>
</div>

    <!-- معلومات الطبيب المختصرة -->
    <div class="doctor-profile">
      <div class="avatar-circle">
        <i class="ti ti-stethoscope"></i>
      </div>
      <div class="doctor-meta">
        <p class="doctor-name">{{ authStore.currentUser?.fullName || 'د. ليث حسان' }}</p>
        <span class="doctor-role">{{ authStore.currentUser?.role || 'طبيب' }}</span>
      </div>
    </div>

    <!-- عناصر القائمة -->
    <nav class="nav-menu">
      <router-link to="/doctor/dashboard" class="nav-item">
        <i class="ti ti-layout-dashboard"></i>
        <span>لوحة التحكم</span>
      </router-link>

      <router-link to="/doctor/create-guardian" class="nav-item">
        <i class="ti ti-user-plus"></i>
        <span>إنشاء حساب ولي الأمر</span>
      </router-link>

      <router-link to="/doctor/children" class="nav-item">
        <i class="ti ti-users"></i>
        <span>سجل الأطفال</span>
      </router-link>

      <router-link to="/doctor/vaccines-reports" class="nav-item">
        <i class="ti ti-report-medical"></i>
        <span>اللقاحات والتقارير</span>
      </router-link>

      <button type="button" class="nav-item nav-btn" @click="goToAppointments">
        <i class="ti ti-calendar"></i>
        <span>المواعيد</span>
      </button>

      <router-link to="/doctor/reminders" class="nav-item">
        <i class="ti ti-bell-ringing"></i>
        <span>التذكيرات</span>
      </router-link>
    </nav>

    <!-- الرابط السفلي لتسجيل الخروج -->
    <div class="sidebar-bottom">
      <button type="button" class="logout-link" @click="handleLogout">
        <i class="ti ti-logout"></i>
        <span>تسجيل الخروج</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import LogoIcon from '../components/LogoIcon.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

function goToAppointments() {
  uiStore.highlightAppointments = true
  if (route.name !== 'doctor-dashboard') {
    router.push({ name: 'doctor-dashboard' })
  }
}

async function handleLogout() {
  await authStore.performLogout()
  router.push('/login')
}
</script>

<style scoped>

.sidebar-card-container {
  background: var(--color-card);
  border-radius: 24px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  min-height: calc(100vh - 40px);
  direction: rtl;
}

.logo { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: var(--color-teal-800); }
.theme-toggle { background: var(--color-surface-muted); border: none; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; color: var(--color-text-muted); font-size: 18px; }

.doctor-profile { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-surface-muted); border-radius: 16px; border: 1px solid var(--color-border); }
.avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: var(--color-green-100); color: var(--color-teal-800); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.user-meta { display: flex; flex-direction: column; gap: 2px; }
.user-name { margin: 0; font-size: 13.5px; font-weight: 700; color: var(--color-text); }
.user-role { font-size: 11px; color: var(--color-teal-800); font-weight: 600; }

.nav-menu { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-radius: 20px; color: var(--color-text-muted); font-size: 14.5px; font-weight: 600; text-decoration: none; background: transparent; border: none; cursor: pointer; width: 100%; text-align: right; transition: all 0.2s ease; }
.nav-item i { font-size: 18px; }
.nav-item:hover { background: var(--color-surface-muted); color: var(--color-text); }

.nav-item.router-link-exact-active {
  background: var(--color-green-800) !important;
  color: #ffffff !important;
  box-shadow: 0 6px 16px rgba(14, 107, 82, 0.28) !important;
}
.nav-item.router-link-exact-active i { color: #ffffff !important; }

.sidebar-bottom { margin-top: auto; padding: 12px 10px 0; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 10px; }
.support-link { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); font-size: 13px; font-weight: 500; }
.support-link:hover { color: var(--color-teal-800); }
.logout-link { display: flex; align-items: center; gap: 8px; color: var(--color-danger-600); font-size: 13.5px; background: none; border: none; font-weight: 600; cursor: pointer; padding: 8px 0; width: 100%; transition: opacity 0.2s; text-align: right; }
.logout-link:hover { opacity: 0.8; }
</style>