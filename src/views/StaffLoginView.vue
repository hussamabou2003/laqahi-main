<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__brand">
        <!-- اللوجو والاسم الأساسي -->
        <LogoIcon size="48" style="color: var(--color-teal-700);" />
        <span class="brand-text">لقاحي</span>
      </div>

      <h1 class="login-card__title">بوابة الموظفين</h1>
      <p class="login-card__subtitle">اختر صفتك الوظيفية للمتابعة</p>

      <!-- بطاقات اختيار الصلاحية (طبيب أو مدير) -->
      <div class="role-toggle-group">
        <button 
          type="button" 
          class="role-card" 
          :class="{ 'role-card--active': selectedRole === 'doctor' }"
          @click="selectedRole = 'doctor'"
        >
          <div class="role-icon"><i class="ti ti-stethoscope"></i></div>
          <span>كادر طبي</span>
        </button>

        <button 
          type="button" 
          class="role-card" 
          :class="{ 'role-card--active': selectedRole === 'admin' }"
          @click="selectedRole = 'admin'"
        >
          <div class="role-icon"><i class="ti ti-shield-check"></i></div>
          <span>مدير نظام</span>
        </button>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <div class="form-field">
          <label>{{ selectedRole === 'doctor' ? 'حساب الطبيب' : 'حساب المدير' }}</label>
          <input v-model.trim="username" type="text" :placeholder="selectedRole === 'doctor' ? 'أدخل حساب الطبيب' : 'أدخل حساب المدير'" autocomplete="username" required />
        </div>

        <div class="form-field">
          <label>كلمة المرور</label>
          <input v-model="password" type="password" placeholder="الرجاء إدخال كلمة المرور" autocomplete="current-password" required />
        </div>

        <p v-if="errorMessage" class="login-form__error"><i class="ti ti-alert-circle"></i> {{ errorMessage }}</p>

        <button class="btn btn-primary login-form__submit" type="submit" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner"></span>
          {{ isSubmitting ? 'جارٍ التحقق...' : 'تسجيل الدخول' }}
        </button>
      </form>


    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import LogoIcon from '../components/LogoIcon.vue'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const username = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

// المتغير المسؤول عن تحديد نوع الحساب (طبيب أو مدير)
const selectedRole = ref('doctor')


async function submit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const user = await authStore.performLogin(username.value, password.value, selectedRole.value)
    if (selectedRole.value === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/doctor/dashboard')
    }
  } catch (err) {
    errorMessage.value = err.message || 'بيانات الدخول غير صحيحة، أو الحساب غير مفعل.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--color-bg); direction: rtl; }
.login-card { width: 100%; max-width: 420px; background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 36px 32px; }
.login-card__brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 22px; }
.brand-text { font-size: 26px; font-weight: 800; color: var(--color-teal-800); }
.login-card__title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 8px; color: var(--color-text); }
.login-card__subtitle { font-size: 14px; color: var(--color-text-muted); text-align: center; margin-bottom: 26px; }

/* تنسيق بطاقات اختيار الصلاحية */
.role-toggle-group { display: flex; gap: 12px; margin-bottom: 24px; }
.role-card { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; background: var(--color-bg); border: 2px solid var(--color-border); border-radius: 16px; cursor: pointer; transition: all 0.2s ease; color: var(--color-text-muted); font-weight: 700; font-size: 14px; font-family: inherit; }
.role-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--color-white); display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.2s ease; box-shadow: var(--shadow-sm); }
.role-card:hover { border-color: var(--color-green-100); background: var(--color-green-50); color: var(--color-teal-800); }
.role-card--active { border-color: var(--color-green-600); background: var(--color-green-50); color: var(--color-teal-800); }
.role-card--active .role-icon { background: var(--color-green-600); color: var(--color-white); box-shadow: 0 4px 12px rgba(31, 161, 95, 0.3); }

.form-field { margin-bottom: 16px; text-align: right; }
.form-field label { display: block; font-size: 13px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px; }
.form-field input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg); font-size: 14px; color: var(--color-text); font-family: inherit; transition: all 0.2s; }
.form-field input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); background: var(--color-white); }
.login-form__error { display: flex; align-items: center; gap: 6px; color: var(--color-danger); font-size: 13px; font-weight: 600; margin: -4px 0 16px; background: var(--color-danger-light); padding: 10px; border-radius: 8px; text-align: right; }
.login-form__submit { width: 100%; padding: 14px; margin-top: 8px; border-radius: 12px; font-size: 15px; }

.demo-box { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--color-border); text-align: right; min-height: 140px; }
.demo-box__title { font-size: 13px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 12px; }
.demo-account { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; margin-bottom: 10px; text-align: right; background: var(--color-bg); border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s ease; }
.demo-account:hover { background: var(--color-primary-light); border-color: var(--color-primary); transform: translateY(-2px); }
.demo-account__avatar { width: 40px; height: 40px; border-radius: 50%; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.demo-account__info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.demo-account__info strong { font-size: 14px; color: var(--color-text); }
.demo-account__info small { font-size: 12px; color: var(--color-text-muted); }
.demo-account__use { font-size: 12px; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 4px; }
.no-data { font-size: 13px; color: var(--color-text-soft); text-align: center; margin-top: 20px; }
.spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff; animation: spin 0.8s linear infinite; display: inline-block; margin-left: 8px;}
@keyframes spin { to { transform: rotate(360deg); } }
</style>