import { defineStore } from 'pinia'
import { apiFetch } from '../utils/api'

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
        const res = await apiFetch('/admin/settings')
        const data = res.data || res
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
        await apiFetch('/admin/settings', { method: 'POST', body: payload })
        Object.assign(this.$state, payload)
      } catch (err) {
        throw new Error('فشل تحديث الإعدادات')
      }
    },

    async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
      const res = await apiFetch('/admin/settings/change-password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation
        }
      })
      // apiFetch automatically throws if !res.ok, so if we reach here it was successful.
    },

    async killSessions() {
      await apiFetch('/admin/settings/kill-sessions', { method: 'POST', body: {} })
    }
  }
})
