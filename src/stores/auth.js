import { defineStore } from 'pinia'
import { can as canDo, roleLabel } from './permissions'
import { loginApi, registerParentApi, fetchMeApi, logoutApi, setToken, clearToken, getToken, normalizeUser } from '../utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 1. قراءة البيانات من المتصفح مباشرة عند تحديث الصفحة
    isLoggedIn: localStorage.getItem('auth_isLoggedIn') === 'true',
    role: localStorage.getItem('auth_role') || null, // 'parent' | 'doctor' | 'admin'
    currentUser: JSON.parse(localStorage.getItem('auth_user')) || null,
    loading: false,
    error: null
  }),

  getters: {
    user: (state) => state.currentUser,

    isAuthenticated: (state) => state.isLoggedIn,

    userRoleLabel: (state) => {
      if (!state.currentUser) return ''
      if (state.role === 'parent') return 'ولي أمر'
      if (state.role === 'doctor') return 'طبيب'
      // إذا كان مدير أو موظف إداري نستخدم ملف الصلاحيات
      return roleLabel ? roleLabel(state.role) : state.role
    }
  },

  actions: {
    // دالة تسجيل الدخول الموحدة (المحلي والستيت)
    login(userData, role = 'parent') {
      const normalized = normalizeUser(userData)
      this.isLoggedIn = true
      this.role = role
      this.currentUser = normalized

      localStorage.setItem('auth_isLoggedIn', 'true')
      localStorage.setItem('auth_role', role)
      localStorage.setItem('auth_user', JSON.stringify(normalized))
    },

    async performLogin(email, password, role = 'parent') {
      this.loading = true
      this.error = null
      try {
        const res = await loginApi(email, password, role)
        const data = res?.data || res
        const userObj = normalizeUser(data?.user || data)
        const userRole = data?.role || role
        if (data?.token) {
          setToken(data.token, userRole)
        }
        this.login(userObj, userRole)
        return userObj
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async performRegister(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await registerParentApi(payload)
        const data = res?.data || res
        if (data?.token) {
          setToken(data.token, 'parent')
        }
        const userObj = normalizeUser(data?.user || data)
        this.login(userObj, 'parent')
        return userObj
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async bootstrap() {
      const token = getToken()
      if (!token) {
        this.logout()
        return false
      }
      try {
        const res = await fetchMeApi()
        const data = res?.data || res
        if (data?.user) {
          const userObj = normalizeUser(data.user)
          const userRole = data.role || this.role || 'parent'
          this.login(userObj, userRole)
          return true
        }
        return false
      } catch {
        this.logout()
        return false
      }
    },

    async performLogout() {
      try {
        await logoutApi()
      } catch {
        // تجاهل أخطاء الشبكة أثناء تسجيل الخروج
      } finally {
        this.logout()
      }
    },

    // دالة تسجيل الخروج المحلية
    logout() {
      this.isLoggedIn = false
      this.role = null
      this.currentUser = null

      clearToken()
      localStorage.removeItem('auth_isLoggedIn')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_user')
    },

    // دالة فحص الصلاحيات (مهمة لصفحات لوحة تحكم المدير)
    can(action) {
      if (!this.currentUser) return false
      if (this.role === 'parent') return false // ولي الأمر ليس لديه صلاحيات إدارية

      // الكادر الطبي والمدراء يمرون عبر ملف الصلاحيات
      if (canDo) {
        return canDo(this.role, action)
      }
      return true
    }
  }
})
