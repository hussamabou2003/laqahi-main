import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/theme.css'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { i18n } from './i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

const authStore = useAuthStore(pinia)
const settingsStore = useSettingsStore(pinia)

const lang = settingsStore.general?.language || 'ar'
i18n.global.locale.value = lang
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'

authStore.bootstrap().finally(() => {
  app.mount('#app')
})