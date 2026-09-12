<template>
  <div class="signup-page">
    <div class="signup-topbar">
      <router-link :to="{ name: 'home' }" class="back-home-link">
        <i class="ti ti-arrow-right"></i> العودة للرئيسية
      </router-link>
      
      <div class="logo">
        <LogoIcon /> لقاحي
      </div>
    </div>

    <div class="signup-card">
      
      <img src="@/assets/toy-train.png" alt="Toy Train" class="toy-train-decoration" />

      <div class="card-header-text">
        <h1>إنشاء حساب مستخدم جديد</h1>
        <p class="subtitle">سجل بيانات ولي الأمر وأطفالهم لإدارة اللقاحات بكل سهولة</p>
      </div>

      <!-- مؤشر الخطوات الجديد -->
      <div class="steps-wrapper">
        <div class="step" :class="{ active: currentStep >= 1 }">
          <div class="step-circle">1</div>
          <span class="step-label">بيانات ولي الأمر</span>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
        <div class="step" :class="{ active: currentStep >= 2 }">
          <div class="step-circle">2</div>
          <span class="step-label">بيانات الطفل</span>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
        <div class="step" :class="{ active: currentStep >= 3 }">
          <div class="step-circle">3</div>
          <span class="step-label">تأكيد الحساب</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" @focusin="handleFocusIn">
        <section class="form-section" data-step="1">
          <h2><i class="ti ti-user"></i> بيانات ولي الأمر</h2>
          <label class="form-field">
            <span>الاسم الكامل</span>
            <input v-model.trim="guardian.fullName" type="text" placeholder="اسمك الكامل" required />
          </label>
          <label class="form-field">
            <span>رقم الهوية الوطنية</span>
            <input v-model.trim="guardian.nationalId" type="text" inputmode="numeric" maxlength="11" placeholder="11 رقمًا" required />
            <span v-if="errors.nationalId" class="field-error">{{ errors.nationalId }}</span>
          </label>
          <label class="form-field">
            <span>رقم الجوال</span>
            <input v-model.trim="guardian.phone" type="tel" inputmode="numeric" maxlength="10" placeholder="09XXXXXXXX" required />
            <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
          </label>
          <label class="form-field">
            <span>البريد الإلكتروني</span>
            <input v-model.trim="guardian.email" type="email" placeholder="example@email.com" required />
          </label>
          <label class="form-field">
            <span>كلمة المرور</span>
            <div class="password-wrapper">
              <input v-model="guardian.password" :type="showPassword ? 'text' : 'password'" minlength="8" placeholder="8 أحرف وأرقام على الأقل" required />
              <button type="button" class="eye-toggle" @click="showPassword = !showPassword" aria-label="إظهار/إخفاء كلمة المرور">
                <i :class="showPassword ? 'ti ti-eye-off' : 'ti ti-eye'"></i>
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </label>
        </section>

        <section class="form-section" data-step="2">
          <h2><i class="ti ti-baby-carriage"></i> بيانات الطفل</h2>
          <label class="form-field">
            <span>الاسم الكامل</span>
            <input v-model.trim="child.fullName" type="text" placeholder="اسم الطفل الكامل" required />
          </label>
          <label class="form-field">
            <span>تاريخ الميلاد</span>
            <input v-model="child.birthDate" type="date" required />
          </label>
          <label class="form-field">
            <span>الجنس</span>
            <select v-model="child.gender" required>
              <option disabled value="">اختر الجنس</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </label>
        </section>

        <section class="form-section" data-step="3">
          <h2><i class="ti ti-map-pin"></i> الموقع الجغرافي</h2>
          <label class="form-field">
            <span>المدينة (المحافظة)</span>
            <GovernorateSelect v-model="location.city" type="text" placeholder="مثال: دمشق" required />
          </label>
          <label class="form-field" v-if="location.city">
            <span>المركز الصحي الأقرب إليك</span>
            <select v-model="location.centerId" required>
              <option value="" disabled>اختر المركز الصحي</option>
              <option v-for="center in filteredCenters" :key="center.id" :value="center.id">
                {{ center.name }} ({{ center.address }})
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>الحي</span>
            <input v-model.trim="location.district" type="text" placeholder="اسم الحي" required />
          </label>
          <label class="checkbox-field">
            <input v-model="location.agreed" type="checkbox" required />
            <span>أوافق على سياسة الخصوصية والشروط الخاصة بالنظام</span>
          </label>
        </section>

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" class="btn-primary">إنشاء الحساب والمتابعة</button>
        </div>
      </form>

      <p class="login-hint">
        لديك حساب بالفعل؟ <router-link to="/login">تسجيل الدخول</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import LogoIcon from '../components/LogoIcon.vue'
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChildrenStore } from '../stores/children'
import { useAuthStore } from '../stores/auth'
import { useCentersStore } from '../stores/centers'
import GovernorateSelect from '../components/GovernorateSelect.vue'
import { useGuardiansStore } from '../stores/guardians'

const guardiansStore = useGuardiansStore()
const currentStep = ref(1)
const router = useRouter()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()
const centersStore = useCentersStore()

onMounted(async () => {
  if (!centersStore.list.length) {
    await centersStore.fetchCenters()
  }
})

const error = ref('')
const errors = reactive({ nationalId: '', phone: '' })
const guardian = reactive({ fullName: '', nationalId: '', phone: '', email: '' , password: '' })
const child = reactive({ fullName: '', birthDate: '', gender: '' })
const location = reactive({ city: '', district: '', centerId: '', agreed: false })

const filteredCenters = computed(() => {
  return centersStore.list.filter(c => c.province === location.city || c.address?.includes(location.city))
})

const NATIONAL_ID_REGEX = /^\d{11}$/
const SYRIAN_PHONE_REGEX = /^09\d{8}$/
const showPassword = ref(false)
errors.password = ''
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

function validateFields() {
  errors.nationalId = ''
  errors.phone = ''
  errors.password = ''
  if (!NATIONAL_ID_REGEX.test(guardian.nationalId)) { errors.nationalId = 'رقم الهوية يجب أن يتكون من 11 رقمًا بالضبط' }
  if (!SYRIAN_PHONE_REGEX.test(guardian.phone)) { errors.phone = 'رقم الجوال يجب أن يبدأ بـ 09 ويتكون من 10 أرقام' }
  if (!PASSWORD_REGEX.test(guardian.password)) { errors.password = 'كلمة المرور يجب أن تتكون من 8 رموز على الأقل (أحرف وأرقام معًا)' }
  if (!errors.nationalId && guardiansStore.isNationalIdTaken(guardian.nationalId)) { errors.nationalId = 'هذا الرقم الوطني مسجّل بحساب موجود مسبقًا' }
  return !errors.nationalId && !errors.phone && !errors.password
}

function handleFocusIn(e) {
  const section = e.target.closest('[data-step]')
  if (section) currentStep.value = Number(section.dataset.step)
}

async function handleSubmit() {
  error.value = ''
  if (!validateFields()) {
    error.value = 'الرجاء تصحيح الحقول المظللة بالأحمر'
    return
  }
  if (!location.centerId) {
    error.value = 'الرجاء اختيار المركز الصحي'
    return
  }
  if (!location.agreed) {
    error.value = 'يجب الموافقة على سياسة الخصوصية والشروط للمتابعة'
    return
  }

  try {
    // 1. إنشاء حساب ولي الأمر لدى الباك إند
    await authStore.performRegister({
      name: guardian.fullName,
      email: guardian.email,
      password: guardian.password,
      password_confirmation: guardian.password,
      national_id: guardian.nationalId,
      phone: guardian.phone,
      province: location.city,
      center_id: location.centerId
    })

    // 2. إضافة الطفل لولي الأمر
    if (child.fullName && child.birthDate) {
      await childrenStore.addChild({
        name: child.fullName,
        birth_date: child.birthDate,
        gender: child.gender || 'male',
        center_id: location.centerId
      })
    }

    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'حدث خطأ أثناء إنشاء الحساب'
  }
}
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  background-color: #f8fafc;
}

.signup-topbar {
  width: 100%;
  max-width: 550px; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-home-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.2s;
}

.back-home-link:hover {
  color: #0f766e;
}

.logo {
  font-weight: 700;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
}

.logo svg {
  width: 24px;   
  height: 24px;  
}

.signup-card {
  position: relative;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.03);
}

/* تنسيق صورة القطار */
.toy-train-decoration {
  position: absolute;
  bottom: 180px; 
  left: -40px;   
  width: 110px;  
  z-index: 10;
  filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1)); 
}

.card-header-text {
  text-align: center;
  margin-bottom: 32px;
}

.card-header-text h1 {
  font-size: 22px;
  margin: 0 0 8px;
  color: var(--color-primary-dark);
}

.card-header-text .subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

.steps-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
  direction: rtl;
  padding: 0 10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
  width: 90px;
}

.step-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.step.active .step-circle {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 0 0 5px var(--color-primary-light);
}

.step.active .step-label {
  color: var(--color-primary);
  font-weight: 700;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #cbd5e1;
  margin: 0 4px;
  margin-bottom: 26px; 
  transition: background 0.3s ease;
}

.step-line.active {
  background: var(--color-primary);
}


.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}
.form-section:last-of-type { border-bottom: none; padding-bottom: 0; }
.form-section h2 { font-size: 14px; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; color: var(--color-primary-dark); }

.form-field { display: flex; flex-direction: column; gap: 6px; font-size: 14px; margin-bottom: 14px; }
.form-field input, .form-field select { border: 1px solid var(--color-border); border-radius: 8px; padding: 12px; font-size: 14px; outline: none; }
.form-field input:focus, .form-field select:focus { border-color: var(--color-primary); }

.field-error { color: var(--color-danger); font-size: 12px; }
.checkbox-field { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--color-text-muted); margin-bottom: 14px; }
.form-error { color: var(--color-danger); font-size: 13px; margin-bottom: 12px; text-align: center; }

.form-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-primary { flex: 1; padding: 14px 0; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; border: none; transition: background 0.2s; }
.btn-primary:hover { background: var(--color-primary-dark); }

.login-hint { text-align: center; font-size: 13px; color: var(--color-text-muted); margin: 24px 0 0; }
.login-hint a { color: var(--color-primary); font-weight: 700; }

.password-wrapper { position: relative; }
.password-wrapper input { width: 100%; padding-left: 40px; }
.eye-toggle { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 18px; }

@media (max-width: 600px) {
  .toy-train-decoration {
    width: 80px;
    left: -20px;
    bottom: -20px;
  }
}
</style>