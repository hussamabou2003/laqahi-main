import { defineStore } from 'pinia'
import api from '../utils/api'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    maintenance_mode: 'false',
    support_phone: '0999000000',
    support_email: 'support@laqahi.com',
    notification_template: 'حان موعد لقاح طفلك {child_name}، يرجى مراجعة المركز.',
    notifications_enabled: 'true',
    loading: false
  }),

  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        const res = await api.get('/admin/settings')
        const data = await res.json()
        this.maintenance_mode = data.maintenance_mode || 'false'
        this.support_phone = data.support_phone || ''
        this.support_email = data.support_email || ''
        this.notification_template = data.notification_template || ''
        this.notifications_enabled = data.notifications_enabled || 'true'
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      } finally {
        this.loading = false
      }
    },
    
    async updateSettings(payload) {
      try {
        await api.post('/admin/settings', payload)
        Object.assign(this.$state, payload)
      } catch (err) {
        throw new Error('فشل تحديث الإعدادات')
      }
    },

    async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
      const res = await api.post('/admin/settings/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'فشل تغيير كلمة المرور')
      }
    },

    async killSessions() {
      const res = await api.post('/admin/settings/kill-sessions', {})
      if (!res.ok) throw new Error('فشل تسجيل الخروج')
    }
  }
})
