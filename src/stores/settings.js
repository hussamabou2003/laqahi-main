import { defineStore } from 'pinia'

const STORAGE_KEY = 'laqahi_settings'

const defaults = {
  general: {
    systemName: 'لقاحي — نظام التحصين الذكي',
    timezone: 'Asia/Damascus',
    language: 'ar'
  },
  notifications: {
    stockAlerts: true,
    newAccountRequests: true,
    weeklyEmailReport: false
  },
  security: {
    twoFactor: false,
    sessionTimeoutMinutes: 30
  }
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return structuredClone(defaults)
  try {
    return { ...structuredClone(defaults), ...JSON.parse(saved) }
  } catch {
    return structuredClone(defaults)
  }
}

export const useSettingsStore = defineStore('settings', {
  state: () => load(),
  actions: {
    save(section, patch) {
      this[section] = { ...this[section], ...patch }
      this.persist()
    },
    persist() {
      const { general, notifications, security } = this
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ general, notifications, security }))
    },
    resetToDefaults() {
      this.general = structuredClone(defaults.general)
      this.notifications = structuredClone(defaults.notifications)
      this.security = structuredClone(defaults.security)
      this.persist()
    }
  }
})
