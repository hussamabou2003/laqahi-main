import { defineStore } from 'pinia'
import { getAuditLogsApi } from '../utils/api'

export const useAuditStore = defineStore('audit', {
  state: () => ({
    entries: [],
    loading: false,
    error: null
  }),
  getters: {
    types(state) {
      const set = new Map()
      state.entries.forEach((e) => set.set(e.type, e.typeLabel || e.type))
      return Array.from(set, ([type, label]) => ({ type, label }))
    }
  },
  actions: {
    async fetchAuditLogs(queryObj) {
      this.loading = true
      this.error = null
      try {
        const data = await getAuditLogsApi(queryObj)
        this.entries = (data || []).map(item => ({
          id: item.id,
          type: item.target_table || item.actor_type || 'system',
          typeLabel: item.action || item.actor_type || 'عملية',
          actor: item.actor_type + ' #' + (item.actor_id || ''),
          details: typeof item.details === 'object' ? JSON.stringify(item.details) : (item.details || item.action),
          time: item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : ''
        }))
        return this.entries
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    log(type, typeLabel, details, actor = 'النظام') {
      const now = new Date()
      const time = now.toLocaleString('ar-EG')
      this.entries.unshift({
        id: Date.now(),
        type,
        typeLabel,
        actor,
        details,
        time
      })
    }
  }
})
