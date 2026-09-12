import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue' // استدعاء الصفحة الرئيسية
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import ParentDashboard from '../views/ParentDashboard.vue'
import ChildrenList from '../views/ChildrenList.vue'
import ChildDetailsView from '../views/ChildDetailsView.vue'
import ParentNotificationsView from '../views/ParentNotificationsView.vue'
import DoctorDashboard from '../views/doctor/DoctorDashboard.vue'
import CreateGuardianAccount from '../views/doctor/CreateGuardianAccount.vue'
import ChildrenRecords from '../views/doctor/ChildrenRecords.vue'
import VaccinesReports from '../views/doctor/VaccinesReports.vue'
import DoctorReminders from '../views/doctor/DoctorReminders.vue'
import { useAuthStore } from '../stores/auth'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import CentersView from '../views/admin/CentersView.vue'
import DoctorsView from '../views/admin/DoctorsView.vue'
import SettingsView from '../views/admin/SettingsView.vue'
import AuditLogView from '../views/admin/AuditLogView.vue'
import AdminReportsView from '../views/admin/ReportsView.vue'
import InventoryView from '../views/admin/InventoryView.vue'
import NotificationsView from '../views/doctor/NotificationsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { role: null } },
    { path: '/login', name: 'login', component: LoginView, meta: { role: null } },
    { path: '/signup', name: 'signup', component: SignupView, meta: { role: null } },
    { path: '/staff-login', name: 'staff-login', component: () => import('../views/StaffLoginView.vue'), meta: { role: null } },

    // مسارات ولي الأمر (Parent)
    { path: '/dashboard/:childId?', name: 'dashboard', component: ParentDashboard, meta: { role: 'parent' } },
    { path: '/children', name: 'children', component: ChildrenList, meta: { role: 'parent' } },
    { path: '/child/:childId/details', name: 'child-details', component: ChildDetailsView, meta: { role: 'parent' } },
    { path: '/notifications', name: 'parent-notifications', component: ParentNotificationsView, meta: { role: 'parent' } },
    { path: '/settings', name: 'parent-settings', component: () => import('../views/ParentSettingsView.vue'), meta: { role: 'parent' } },

    // مسارات الطبيب (Doctor)
    { path: '/doctor/dashboard', name: 'doctor-dashboard', component: DoctorDashboard, meta: { role: 'doctor' } },
    { path: '/doctor/create-guardian/:childId?', name: 'doctor-create-guardian', component: CreateGuardianAccount, meta: { role: 'doctor' } },
    { path: '/doctor/children', name: 'doctor-children', component: ChildrenRecords, meta: { role: 'doctor' } },
    { path: '/doctor/vaccines-reports', name: 'doctor-vaccines-reports', component: VaccinesReports, meta: { role: 'doctor' } },
    { path: '/doctor/notifications', name: 'doctor-notifications', component: NotificationsView, meta: { role: 'doctor' } },
    { path: '/doctor/reminders', name: 'doctor-reminders', component: DoctorReminders, meta: { role: 'doctor' } },

    // واجهات مدير النظام (Admin)
    { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboard, meta: { role: 'admin' } },
    { path: '/admin/centers', name: 'admin-centers', component: CentersView, meta: { role: 'admin' } },
    { path: '/admin/doctors', name: 'admin-doctors', component: DoctorsView, meta: { role: 'admin' } },
    { path: '/admin/settings', name: 'admin-settings', component: SettingsView, meta: { role: 'admin' } },
    { path: '/admin/audit', name: 'admin-audit', component: AuditLogView, meta: { role: 'admin' } },
    { path: '/admin/reports', name: 'admin-reports', component: AdminReportsView, meta: { role: 'admin' } },
    { path: '/admin/inventory', name: 'admin-inventory', component: InventoryView, meta: { role: 'admin' } }

    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const publicPages = ['home', 'login', 'signup', 'staff-login', 'not-found']

  if (publicPages.includes(to.name)) {
    return true
  }

  if (!authStore.isLoggedIn) {
    return { name: 'login' }
  }

  // فحص حماية الدور المسموح للمسار
  const requiredRole = to.meta?.role
  if (requiredRole && authStore.role !== requiredRole) {
    if (authStore.role === 'admin') return { name: 'admin-dashboard' }
    if (authStore.role === 'doctor') return { name: 'doctor-dashboard' }
    return { name: 'dashboard' }
  }

  return true
})

export default router
