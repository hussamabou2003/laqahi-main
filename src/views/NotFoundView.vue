<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppLogo from '../components/LogoIcon.vue'

const auth = useAuthStore()
const homeTarget = computed(() => (auth.isAuthenticated ? { name: 'dashboard' } : { name: 'login' }))
</script>

<template>
  <div class="not-found">
    <div class="not-found__card">
      <AppLogo :size="44" />

      <p class="not-found__code">404</p>
      <h1 class="not-found__title">لم يتم العثور على هذه الصفحة</h1>
      <p class="not-found__desc">
        الرابط الذي حاولت الوصول إليه غير موجود، أو ربما تم نقله أو حذفه.
      </p>

      <router-link :to="homeTarget" class="btn btn-primary">
        العودة إلى {{ auth.isAuthenticated ? 'لوحة التحكم' : 'تسجيل الدخول' }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 80% 20%, var(--color-green-50), var(--color-bg) 60%);
}

.not-found__card {
  text-align: center;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.not-found__code {
  font-size: 64px;
  font-weight: 900;
  color: var(--color-green-800);
  line-height: 1;
  margin: 22px 0 10px;
}

.not-found__title {
  font-size: 19px;
  font-weight: 800;
  margin-bottom: 10px;
}

.not-found__desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 26px;
  line-height: 1.8;
}
</style>
