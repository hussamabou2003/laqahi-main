import { defineStore } from 'pinia'

const STORAGE_KEY = 'laqahi_theme'

function apply(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

const savedDark = localStorage.getItem(STORAGE_KEY) === 'dark'
apply(savedDark)

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: savedDark
  }),
  actions: {
    toggle() {
      this.dark = !this.dark
      apply(this.dark)
      localStorage.setItem(STORAGE_KEY, this.dark ? 'dark' : 'light')
    }
  }
})
