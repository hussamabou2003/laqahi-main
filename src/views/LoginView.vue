<template>
  <div class="login-page">
    <div class="top-nav">
      <router-link :to="{ name: 'home' }" class="back-home-link">
        <i class="ti ti-arrow-right"></i> العودة للرئيسية
      </router-link>
    </div>

    <div class="login-container">
      <div class="login-header">
        <div class="logo-box">
          <LogoIcon size="48" style="color: var(--color-teal-700);" />
          <span class="brand-text">لقاحي</span>
        </div>
        <h2>دخول أولياء الأمور</h2>
        <p class="subtitle">قم بتسجيل الدخول لمتابعة سجلات أطفالك</p>
      </div>

      <!-- Forgot Password Flow -->
      <div v-if="forgotPasswordMode" class="forgot-password-flow">
        <h3 class="mb-3">نسيان كلمة المرور</h3>
        
        <form v-if="forgotStep === 1" @submit.prevent="handleForgotSendCode">
          <p class="subtitle mb-3">أدخل بريدك الإلكتروني لتلقي رمز التحقق</p>
          <div class="input-group">
            <i class="ti ti-mail input-icon"></i>
            <input v-model.trim="forgotEmail" type="email" placeholder="البريد الإلكتروني" required />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'جاري الإرسال...' : 'إرسال الرمز' }}
          </button>
          <button type="button" class="btn-text mt-2" style="width: 100%" @click="forgotPasswordMode = false">عودة لتسجيل الدخول</button>
        </form>
        
        <form v-else-if="forgotStep === 2" @submit.prevent="handleForgotVerifyCode">
          <p class="subtitle mb-3">أدخل رمز التحقق المرسل لبريدك الإلكتروني</p>
          <div class="input-group">
            <input v-model.trim="forgotCode" type="text" placeholder="رمز التحقق (6 أرقام)" required maxlength="6" style="padding-right: 14px; text-align: center; letter-spacing: 4px;" />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading || forgotCode.length !== 6">
            {{ loading ? 'جاري التحقق...' : 'تحقق' }}
          </button>
          <button type="button" class="btn-text mt-2" style="width: 100%" @click="forgotStep = 1">تغيير البريد أو إعادة الإرسال</button>
        </form>

        <p v-if="error" class="form-error mt-3"><i class="ti ti-alert-circle"></i> {{ error }}</p>
      </div>

      <!-- Normal Login Flow -->
      <form v-else @submit.prevent="handleParentLogin" class="login-form">
        <div class="input-group">
          <i class="ti ti-mail input-icon"></i>
          <input v-model.trim="parentForm.email" type="email" placeholder="البريد الإلكتروني" required />
        </div>

        <div class="input-group">
          <i class="ti ti-lock input-icon"></i>
          <input v-model.trim="parentForm.password" :type="showPassword ? 'text' : 'password'" placeholder="كلمة المرور" required />
          <button type="button" class="eye-toggle" @click="showPassword = !showPassword" aria-label="إظهار/إخفاء كلمة المرور">
            <i :class="showPassword ? 'ti ti-eye-off' : 'ti ti-eye'"></i>
          </button>
        </div>

        <p v-if="error" class="form-error"><i class="ti ti-alert-circle"></i> {{ error }}</p>

        <button type="submit" class="btn-primary">تسجيل الدخول</button>
        <button type="button" class="btn-text" @click="openForgotPassword">نسيت كلمة المرور؟</button>

        <p class="signup-hint">
          ليس لديك حساب؟ <router-link :to="{ name: 'signup' }">إنشاء حساب جديد</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LogoIcon from '../components/LogoIcon.vue'
import { forgotPasswordSendCodeApi, forgotPasswordVerifyCodeApi, setToken } from '../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const parentForm = reactive({ email: '', password: '' })

// Forgot Password State
const forgotPasswordMode = ref(false)
const forgotStep = ref(1)
const forgotEmail = ref('')
const forgotCode = ref('')

function openForgotPassword() {
  forgotPasswordMode.value = true
  forgotStep.value = 1
  forgotEmail.value = parentForm.email
  error.value = ''
}

async function handleForgotSendCode() {
  error.value = ''
  loading.value = true
  try {
    await forgotPasswordSendCodeApi(forgotEmail.value)
    forgotStep.value = 2
  } catch (err) {
    error.value = err.message || 'فشل إرسال رمز التحقق'
  } finally {
    loading.value = false
  }
}

async function handleForgotVerifyCode() {
  error.value = ''
  loading.value = true
  try {
    const res = await forgotPasswordVerifyCodeApi(forgotEmail.value, forgotCode.value)
    const data = res?.data || res
    
    setToken(data.token, 'parent')
    authStore.login(data.user, 'parent')
    
    router.push({ path: '/settings', query: { reset_token: data.reset_token } })
  } catch (err) {
    error.value = err.message || 'رمز التحقق غير صحيح'
  } finally {
    loading.value = false
  }
}

async function handleParentLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.performLogin(parentForm.email, parentForm.password, 'parent')
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'بيانات الدخول غير صحيحة'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--color-bg); padding: 24px; direction: rtl; }
.top-nav { position: absolute; top: 24px; right: 24px; }
.back-home-link { display: flex; align-items: center; gap: 6px; color: var(--color-text-muted); font-weight: 600; font-size: 14px; transition: color 0.2s; text-decoration: none; }
.back-home-link:hover { color: var(--color-teal-700); }
.login-container { background: var(--color-white); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-md); border: 1px solid var(--color-border); }
.login-header { text-align: center; margin-bottom: 32px; }
.logo-box { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 16px; }
.brand-text { font-weight: 800; font-size: 26px; color: var(--color-teal-800); }
.login-header h2 { font-size: 22px; margin: 0 0 8px; color: var(--color-text); font-weight: 800; }
.login-header h3 { font-size: 20px; margin: 0 0 8px; color: var(--color-text); font-weight: 700; }
.subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.input-group { position: relative; width: 100%; }
.input-group input { width: 100%; padding: 14px 44px 14px 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; font-size: 14px; outline: none; font-family: inherit; transition: all 0.2s; color: var(--color-text); }
.input-group input:focus { border-color: var(--color-primary); background: var(--color-white); box-shadow: 0 0 0 3px var(--color-primary-light); }
.input-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--color-text-soft); font-size: 18px; pointer-events: none; }
.eye-toggle { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-soft); cursor: pointer; font-size: 18px; padding: 4px; }
.form-error { display: flex; align-items: center; gap: 6px; color: var(--color-danger); background: var(--color-danger-light); padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin: 0; }
.btn-primary { width: 100%; padding: 14px; border-radius: 12px; background: var(--color-green-600); color: #ffffff; border: none; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; transition: background 0.2s; }
.btn-primary:hover { background: var(--color-teal-800); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-text { background: none; border: none; color: var(--color-text-muted); font-size: 13px; cursor: pointer; font-family: inherit; transition: color 0.2s; }
.btn-text:hover { color: var(--color-teal-700); }
.signup-hint { text-align: center; font-size: 14px; color: var(--color-text-muted); margin: 8px 0 0; }
.signup-hint a { color: var(--color-teal-700); font-weight: 700; text-decoration: none; }
.mb-3 { margin-bottom: 16px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 16px; }
</style>