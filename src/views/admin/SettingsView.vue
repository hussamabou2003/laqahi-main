<script setup>
import { ref, reactive } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useSettingsStore } from '../../stores/settings'
import { useThemeStore } from '../../stores/theme'
import { useToastStore } from '../../stores/toast'
import { useAuditStore } from '../../stores/audit'
import { useAuthStore } from '../../stores/auth'

const settings = useSettingsStore()
const theme = useThemeStore()
const toast = useToastStore()
const audit = useAuditStore()
const auth = useAuthStore()

const tabs = [
  { key: 'general', label: 'عام' },
  { key: 'notifications', label: 'الإشعارات' },
  { key: 'security', label: 'الأمان' },
  { key: 'appearance', label: 'المظهر' }
]
const activeTab = ref('general')

const timezones = [
  { value: 'Asia/Damascus', label: 'دمشق (GMT+3)' },
  { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
  { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
  { value: 'Asia/Dubai', label: 'دبي (GMT+4)' }
]

const generalForm = reactive({ ...settings.general })
function saveGeneral() {
  settings.save('general', generalForm)
  audit.log('settings', 'إعدادات', 'تم تحديث الإعدادات العامة للنظام', auth.user?.name)
  toast.success('تم الحفظ', 'تم تحديث الإعدادات العامة بنجاح.')
}

function toggleNotification(key) {
  settings.save('notifications', { [key]: !settings.notifications[key] })
  toast.info('تم التحديث', 'تم تحديث إعدادات الإشعارات.')
}

const securityForm = reactive({ sessionTimeoutMinutes: settings.security.sessionTimeoutMinutes })
function saveSecurity() {
  settings.save('security', { sessionTimeoutMinutes: Number(securityForm.sessionTimeoutMinutes) || 30 })
  audit.log('settings', 'إعدادات', 'تم تحديث إعدادات الأمان (مهلة الجلسة)', auth.user?.name)
  toast.success('تم الحفظ', 'تم تحديث إعدادات الأمان.')
}

function toggleTwoFactor() {
  settings.save('security', { twoFactor: !settings.security.twoFactor })
  toast.info(settings.security.twoFactor ? 'تم تفعيل المصادقة الثنائية' : 'تم إيقاف المصادقة الثنائية')
}

const passwordForm = reactive({ current: '', next: '', confirm: '' })
function changePassword() {
  if (!passwordForm.current || !passwordForm.next) {
    toast.error('بيانات ناقصة', 'يرجى تعبئة كلمة المرور الحالية والجديدة.')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    toast.error('كلمتا المرور غير متطابقتين', 'تأكد من تطابق كلمة المرور الجديدة وتأكيدها.')
    return
  }
  // ملاحظة: هذه واجهة أمامية تجريبية فقط بلا خادم فعلي، لذا لا يتم تغيير كلمة مرور حقيقية.
  toast.success('تم تحديث كلمة المرور', 'سيتم تطبيق التغيير الفعلي عند ربط النظام بخادم حقيقي.')
  passwordForm.current = ''
  passwordForm.next = ''
  passwordForm.confirm = ''
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
        @click="activeTab = t.key"
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
      <h2 class="panel__title">تفضيلات الإشعارات</h2>
      <p class="panel__desc">اختر التنبيهات التي تريد استلامها من النظام.</p>

      <div class="switch-row">
        <div>
          <p class="switch-row__label">تنبيهات نقص مخزون اللقاحات</p>
          <p class="switch-row__desc">تنبيه فوري عند انخفاض مخزون أي لقاح عن الحد الآمن.</p>
        </div>
        <button class="switch" :class="{ 'switch--on': settings.notifications.stockAlerts }" @click="toggleNotification('stockAlerts')">
          <span class="switch__thumb"></span>
        </button>
      </div>

      <div class="switch-row">
        <div>
          <p class="switch-row__label">طلبات تسجيل حسابات جديدة</p>
          <p class="switch-row__desc">إشعار عند تقديم طلب تسجيل حساب طبيب أو مركز جديد.</p>
        </div>
        <button class="switch" :class="{ 'switch--on': settings.notifications.newAccountRequests }" @click="toggleNotification('newAccountRequests')">
          <span class="switch__thumb"></span>
        </button>
      </div>

      <div class="switch-row">
        <div>
          <p class="switch-row__label">تقرير أسبوعي عبر البريد الإلكتروني</p>
          <p class="switch-row__desc">ملخص أسبوعي بأداء النظام يُرسل كل يوم أحد.</p>
        </div>
        <button class="switch" :class="{ 'switch--on': settings.notifications.weeklyEmailReport }" @click="toggleNotification('weeklyEmailReport')">
          <span class="switch__thumb"></span>
        </button>
      </div>
    </section>

    <!-- الأمان -->
    <section v-if="activeTab === 'security'" class="security-grid">
      <div class="card box-pad">
        <h2 class="panel__title">إعدادات الأمان</h2>
        <p class="panel__desc">تحكم بمتطلبات تسجيل الدخول ومهلة الجلسة.</p>

        <div class="switch-row">
          <div>
            <p class="switch-row__label">المصادقة الثنائية (2FA)</p>
            <p class="switch-row__desc">طبقة حماية إضافية عبر رمز تحقق عند تسجيل الدخول.</p>
          </div>
          <button class="switch" :class="{ 'switch--on': settings.security.twoFactor }" @click="toggleTwoFactor">
            <span class="switch__thumb"></span>
          </button>
        </div>

        <div class="form-field">
          <label>مهلة انتهاء الجلسة (بالدقائق)</label>
          <input v-model="securityForm.sessionTimeoutMinutes" type="number" min="5" max="240" />
        </div>

        <button class="btn btn-primary" @click="saveSecurity">حفظ إعدادات الأمان</button>
      </div>

      <div class="card box-pad">
        <h2 class="panel__title">تغيير كلمة المرور</h2>
        <p class="panel__desc">واجهة تجريبية — سيتم ربطها بالتحقق الفعلي لاحقًا.</p>

        <div class="form-field">
          <label>كلمة المرور الحالية</label>
          <input v-model="passwordForm.current" type="password" />
        </div>
        <div class="form-field">
          <label>كلمة المرور الجديدة</label>
          <input v-model="passwordForm.next" type="password" />
        </div>
        <div class="form-field">
          <label>تأكيد كلمة المرور الجديدة</label>
          <input v-model="passwordForm.confirm" type="password" />
        </div>

        <button class="btn btn-outline" @click="changePassword">تحديث كلمة المرور</button>
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
