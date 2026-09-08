import { defineStore } from 'pinia'
import {
  getParentNotificationsApi,
  markReadApi,
  markAllReadApi,
  getDoctorNotificationsApi,
  sendManualNotificationApi
} from '../utils/api'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    loading: false,
    error: null
  }),
  getters: {
    list: (state) => state.items,
    unread: (state) => state.unreadCount || state.items.filter(i => !i.is_read && !i.readAt).length
  },
  actions: {
    async fetchParentNotifications() {
      this.loading = true
      this.error = null
      try {
        const res = await getParentNotificationsApi()
        // res contains { notifications, unread_count }
        if (Array.isArray(res)) {
          this.items = res
          this.unreadCount = res.filter(i => !i.read_at && !i.is_read).length
        } else if (res?.notifications) {
          this.items = res.notifications
          this.unreadCount = res.unread_count ?? 0
        }
        return this.items
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchDoctorNotifications() {
      this.loading = true
      this.error = null
      try {
        const res = await getDoctorNotificationsApi()
        if (Array.isArray(res)) {
          this.items = res
          this.unreadCount = res.filter(i => !i.read_at && !i.is_read).length
        } else if (res?.notifications) {
          this.items = res.notifications
          this.unreadCount = res.unread_count ?? 0
        }
        return this.items
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async markRead(id) {
      try {
        await markReadApi(id)
        const item = this.items.find(i => String(i.id) === String(id))
        if (item) item.is_read = true
        if (this.unreadCount > 0) this.unreadCount--
      } catch (err) {
        this.error = err.message
      }
    },

    async markAllRead() {
      try {
        await markAllReadApi()
        this.items.forEach(i => { i.is_read = true })
        this.unreadCount = 0
      } catch (err) {
        this.error = err.message
      }
    },

    async sendManualNotification(childId, message) {
      try {
        const res = await sendManualNotificationApi({ child_id: childId, message })
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },
    
    addNotification(notif) {
      this.items.unshift({
        ...notif,
        createdAt: notif.createdAt ? new Date(notif.createdAt).getTime() : Date.now()
      })
    },

    add(notif) {
      this.addNotification(notif)
    }
  }
})