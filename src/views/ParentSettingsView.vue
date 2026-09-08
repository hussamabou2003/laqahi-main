<template>
  <DashboardLayout>
    <div class="settings-page">
      <div class="page-header">
        <h1>{{ $t("settings.title") }}</h1>
      </div>

      <section class="settings-card">
        <h2 class="section-title">{{ $t("settings.language") }}</h2>
        <div class="setting-item">
          <p class="setting-desc">{{ $t("settings.langDesc") }}</p>
          <div class="lang-toggle">
            <button 
              :class="['btn-lang', $i18n.locale === 'ar' ? 'active' : '']" 
              @click="changeLanguage('ar')"
            >
              {{ $t("settings.arabic") }}
            </button>
            <button 
              :class="['btn-lang', $i18n.locale === 'en' ? 'active' : '']" 
              @click="changeLanguage('en')"
            >
              {{ $t("settings.english") }}
            </button>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="section-title">{{ $t("settings.accountInfo") }}</h2>
        <div class="setting-item account-info">
          <div>
            <span class="info-label">{{ $t("settings.emailLabel") }}</span>
            <span class="info-value">{{ authStore.currentUser?.email || $t('settings.noEmail') }}</span>
          </div>
        </div>
      </section>

      <section class="settings-card">
        <h2 class="section-title">{{ $t("settings.resetPwd") }}</h2>
        
        <!-- الخطوة 1: زر الإرسال -->
        <div v-if="step === 1" class="setting-item">
          <p class="setting-desc">{{ $t("settings.resetDesc1") }}</p>
          <button class="btn-primary" @click="sendCode" :disabled="loading">
            <i class="ti ti-mail" v-if="!loading"></i>
            {{ loading ? $t('settings.sending') : $t('settings.sendCode') }}
          </button>
        </div>

        <!-- الخطوة 2: إدخال الرمز -->
        <div v-if="step === 2" class="setting-item">
          <p class="setting-desc">{{ $t("settings.resetDesc2") }}</p>
          <div class="input-group">
            <input type="text" v-model="verificationCode" :placeholder="$t('settings.enterCode')" class="form-input" maxlength="6" />
            <button class="btn-primary" @click="verifyCode" :disabled="loading || verificationCode.length !== 6">
              {{ loading ? $t('settings.verifying') : $t('settings.verify') }}
            </button>
          </div>
          <button class="btn-text mt-2" @click="step = 1" :disabled="loading">{{ $t("settings.changeResend") }}</button>
        </div>

        <!-- الخطوة 3: تعيين كلمة جديدة -->
        <div v-if="step === 3" class="setting-item">
          <p class="setting-desc">{{ $t("settings.resetDesc3") }}</p>
          <div class="input-group-col">
            <input type="password" v-model="newPassword" :placeholder="$t('settings.newPwd')" class="form-input" />
            <input type="password" v-model="confirmPassword" :placeholder="$t('settings.confirmPwd')" class="form-input" />
            <button class="btn-primary" @click="changePassword" :disabled="loading || !newPassword || newPassword !== confirmPassword">
              {{ loading ? $t('settings.saving') : $t('settings.savePwd') }}
            </button>
          </div>
        </div>

        <div v-if="successMsg" class="alert-success mt-4">
          <i class="ti ti-check"></i> {{ successMsg }}
        </div>
        <div v-if="errorMsg" class="alert-error mt-4">
          <i class="ti ti-alert-circle"></i> {{ errorMsg }}
        </div>
      </section>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useAuthStore } from '../stores/auth'
import { sendPasswordResetCodeApi, verifyPasswordResetCodeApi, changePasswordApi } from '../utils/api'

const authStore = useAuthStore()

import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settings'
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'

const { locale } = useI18n()
const settingsStore = useSettingsStore()
const route = useRoute()

function changeLanguage(lang) {
  locale.value = lang
  settingsStore.save('general', { language: lang })
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

onMounted(() => {
  if (route.query.reset_token) {
    resetToken.value = route.query.reset_token
    step.value = 3
  }
})

const step = ref(1) // 1: send, 2: verify, 3: change
const loading = ref(false)
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const resetToken = ref('')

const successMsg = ref('')
const errorMsg = ref('')

function clearMsgs() {
  successMsg.value = ''
  errorMsg.value = ''
}

async function sendCode() {
  clearMsgs()
  loading.value = true
  try {
    const res = await sendPasswordResetCodeApi()
    successMsg.value = res.message || 'تم الإرسال بنجاح'
    step.value = 2
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
    setTimeout(clearMsgs, 5000)
  }
}

async function verifyCode() {
  clearMsgs()
  loading.value = true
  try {
    const res = await verifyPasswordResetCodeApi(verificationCode.value)
    successMsg.value = res.message || 'تم التحقق بنجاح'
    resetToken.value = res.data.reset_token
    step.value = 3
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
    setTimeout(clearMsgs, 5000)
  }
}

async function changePassword() {
  clearMsgs()
  loading.value = true
  try {
    const res = await changePasswordApi({
      reset_token: resetToken.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value
    })
    successMsg.value = res.message || 'تم التغيير بنجاح'
    step.value = 1
    verificationCode.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
    setTimeout(clearMsgs, 5000)
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 22px;
  margin: 0;
  color: var(--color-text);
}
.settings-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
}
.setting-item {
  margin-bottom: 12px;
}
.setting-desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}
.lang-toggle {
  display: flex;
  gap: 12px;
}
.btn-lang {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: 0.2s;
}
.btn-lang.active {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-color: var(--color-primary);
}
.account-info {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed var(--color-border);
}
.info-label {
  font-weight: 600;
  color: #475569;
  margin-left: 8px;
}
.info-value {
  font-weight: 700;
  color: var(--color-text);
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}
.input-group-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 300px;
}
.form-input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
}
.form-input:focus {
  border-color: var(--color-primary);
}
.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
}
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.alert-success {
  background: #ecfdf5;
  color: #065f46;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
