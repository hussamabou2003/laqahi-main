<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useSettingsStore } from '../../stores/settings'
import { useThemeStore } from '../../stores/theme'
import { useToastStore } from '../../stores/toast'
import { useAuditStore } from '../../stores/audit'
import { useAuthStore } from '../../stores/auth'
import { getToken } from '../../utils/api'
import { useRoute, useRouter } from 'vue-router'

const settings = useSettingsStore()
const theme = useThemeStore()
const toast = useToastStore()
const audit = useAuditStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'general', label: 'عام' },
  { key: 'notifications', label: 'الإشعارات' },
  { key: 'security', label: 'الأمان' },
  { key: 'appearance', label: 'المظهر' }
]
const activeTab = ref(route.query.tab || 'general')

onMounted(async () => {
  await settings.fetchSettings()
})

function updateTab(tabKey) {
  activeTab.value = tabKey
  router.replace({ query: { ...route.query, tab: tabKey } })
}

async function saveGeneral() {
  try {
    await settings.updateSettings({
      maintenance_mode: String(settings.maintenance_mode),
      support_phone: settings.support_phone,
      support_email: settings.support_email
    })
    audit.log('settings', 'إعدادات', 'تم تحديث الإعدادات العامة (رقم الدعم، وضع الصيانة)', auth.user?.name)
    toast.success('تم الحفظ', 'تم تحديث الإعدادات العامة بنجاح.')
  } catch (err) {
    toast.error('خطأ', 'فشل حفظ الإعدادات')
  }
}

async function saveNotifications() {
  try {
    await settings.updateSettings({
      notification_template: settings.notification_template,
      notifications_enabled: String(settings.notifications_enabled)
    })
    audit.log('settings', 'إعدادات', 'تم تحديث قالب الإشعارات', auth.user?.name)
    toast.success('تم الحفظ', 'تم تحديث إعدادات الإشعارات بنجاح.')
  } catch (err) {
    toast.error('خطأ', 'فشل حفظ الإشعارات')
  }
}

const passwordForm = reactive({ current: '', next: '', confirm: '' })
const isChangingPassword = ref(false)

async function changePassword() {
  if (!passwordForm.current || !passwordForm.next) {
    toast.error('بيانات ناقصة', 'يرجى تعبئة كلمة المرور الحالية والجديدة.')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    toast.error('غير متطابق', 'تأكد من تطابق كلمة المرور الجديدة وتأكيدها.')
    return
  }

  isChangingPassword.value = true
  try {
    await settings.changePassword(passwordForm.current, passwordForm.next, passwordForm.confirm)
    toast.success('تم', 'تم تغيير كلمة المرور بنجاح.')
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
    audit.log('security', 'أمان', 'تم تغيير كلمة مرور مدير النظام', auth.user?.name)
  } catch (err) {
    toast.error('خطأ', err.message || 'تعذر تغيير كلمة المرور')
  } finally {
    isChangingPassword.value = false
  }
}

const isKillingSessions = ref(false)
async function killSessions() {
  if (!confirm('هل أنت متأكد أنك تريد طرد جميع الأطباء والأهالي وإلغاء جلساتهم النشطة؟ سيضطرون لتسجيل الدخول من جديد.')) return
  isKillingSessions.value = true
  try {
    await settings.killSessions()
    toast.success('تم بنجاح', 'تم تسجيل خروج جميع المستخدمين النشطين فوراً.')
    audit.log('security', 'أمان', 'تم إنهاء جميع جلسات الأطباء والأهالي (طوارئ)', auth.user?.name)
  } catch (err) {
    toast.error('خطأ', 'تعذر تنفيذ الإجراء')
  } finally {
    isKillingSessions.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <div>
        <h1 class="page-head__title">إعدادات النظام</h1>
        <p class="page-head__subtitle">تحكم بإعدادات لقاحي العامة والإشعارات والأمان والمظهر.</p>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ 'tab--active': activeTab === t.key }"
        @click="updateTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- عام -->
    <section v-if="activeTab === 'general'" class="card box-pad">
      <h2 class="panel__title">الإعدادات العامة</h2>
      <p class="panel__desc">معلومات أساسية تظهر في واجهة النظام.</p>

      <div class="form-field">
        <label>اسم النظام</label>
        <input v-model="generalForm.systemName" type="text" />
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>المنطقة الزمنية</label>
          <select v-model="generalForm.timezone">
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>لغة الواجهة</label>
          <select v-model="generalForm.language" disabled>
            <option value="ar">العربية</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary" @click="saveGeneral">حفظ التغييرات</button>
    </section>

    <!-- الإشعارات -->
    <section v-if="activeTab === 'notifications'" class="card box-pad">

      <h2 class="panel__title">إعدادات التنبيهات</h2>
      <p class="panel__desc">تخصيص قوالب الرسائل وتفعيل الإشعارات للأهالي.</p>

      <div class="switch-row" style="margin-bottom: 20px;">
        <div>
          <p class="switch-row__label">إرسال الإشعارات تلقائياً</p>
          <p class="switch-row__desc">إذا تم إيقافه، لن يتم إرسال أي إشعار تذكير أو تنبيه لأي مستخدم.</p>
        </div>
        <button class="switch" :class="{ 'switch--on': settings.notifications_enabled === 'true' }" @click="settings.notifications_enabled = settings.notifications_enabled === 'true' ? 'false' : 'true'">
          <span class="switch__thumb"></span>
        </button>
      </div>

      <div class="form-field">
        <label>قالب رسالة التذكير بموعد اللقاح</label>
        <p style="font-size: 12px; color: #666; margin-bottom: 8px;">استخدم المتغير <code>{child_name}</code> ليتم استبداله باسم الطفل تلقائياً.</p>
        <textarea v-model="settings.notification_template" rows="3" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-family: inherit; resize: vertical;"></textarea>
      </div>

      <button class="btn btn-primary" @click="saveNotifications" :disabled="settings.loading">حفظ التفضيلات</button>
    </section>

    <!-- الأمان -->
    <section v-if="activeTab === 'security'" class="security-grid">
      <div class="card box-pad" style="grid-column: 1 / -1;">
        <h2 class="panel__title" style="color: #dc3545;">منطقة الخطر (إدارة الجلسات)</h2>
        <p class="panel__desc">خيارات الأمان المتقدمة في حالات الطوارئ.</p>

        <div style="display: flex; align-items: center; justify-content: space-between; background: #f8d7da; padding: 16px; border-radius: 8px;">
          <div>
            <p style="font-weight: 700; color: #721c24; margin-bottom: 4px;">طرد وتسجيل خروج جميع المستخدمين</p>
            <p style="font-size: 13px; color: #721c24;">هذا الإجراء سيقوم بتسجيل خروج جميع الأطباء والأهالي من المنصة فوراً لمنع أي نشاط مشبوه.</p>
          </div>
          <button class="btn btn-outline" style="color: #dc3545; border-color: #dc3545;" @click="killSessions" :disabled="isKillingSessions">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v2m0 4v.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M5 19h14a2 2 0 0 0 1.84 -2.75L13.74 4a2 2 0 0 0 -3.5 0l-7.1 12.25A2 2 0 0 0 4.89 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            تنفيذ الطرد الآن
          </button>
        </div>
      </div>

      <div class="card box-pad" style="grid-column: 1 / -1;">
        <h2 class="panel__title">تغيير كلمة المرور</h2>
        <p class="panel__desc">تغيير كلمة المرور الخاصة بحساب مدير النظام (Admin).</p>

        <div class="form-row" style="grid-template-columns: 1fr;">
          <div class="form-field">
            <label>كلمة المرور الحالية</label>
            <input v-model="passwordForm.current" type="password" />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>كلمة المرور الجديدة</label>
              <input v-model="passwordForm.next" type="password" />
            </div>
            <div class="form-field">
              <label>تأكيد كلمة المرور الجديدة</label>
              <input v-model="passwordForm.confirm" type="password" />
            </div>
          </div>
        </div>

        <button class="btn btn-primary" @click="changePassword" :disabled="isChangingPassword">تغيير كلمة المرور</button>
      </div>
    </section>

    <!-- المظهر -->
    <section v-if="activeTab === 'appearance'" class="card box-pad">
      <h2 class="panel__title">المظهر</h2>
      <p class="panel__desc">اختر المظهر الذي يناسبك.</p>

      <div class="switch-row">
        <div>
          <p class="switch-row__label">الوضع الداكن</p>
          <p class="switch-row__desc">يقلل إجهاد العين في الإضاءة المنخفضة، ويُطبَّق فورًا على كامل النظام.</p>
        </div>
        <button class="switch" :class="{ 'switch--on': theme.dark }" @click="theme.toggle()">
          <span class="switch__thumb"></span>
        </button>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
}

.tab {
  padding-bottom: 12px;
  font-weight: 700;
  font-size: 14.5px;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
}

.tab--active {
  color: var(--color-green-800);
  border-bottom-color: var(--color-green-800);
}

.box-pad {
  padding: 26px;
  margin-bottom: 20px;
}

.panel__title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 6px;
}

.panel__desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 22px;
}

.security-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}

.switch-row:last-of-type {
  border-bottom: none;
}

.switch-row__label {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 3px;
}

.switch-row__desc {
  font-size: 12px;
  color: var(--color-text-muted);
  max-width: 420px;
}

.switch {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: var(--color-border);
  padding: 3px;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.switch--on {
  background: var(--color-green-600);
}

.switch__thumb {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.switch--on .switch__thumb {
  transform: translateX(-18px);
}

@media (max-width: 900px) {
  .security-grid {
    grid-template-columns: 1fr;
  }
}
</style>
