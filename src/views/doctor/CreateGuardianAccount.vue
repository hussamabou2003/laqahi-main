<template>
  <DoctorLayout>
    <div class="page-header">
      <h1>{{ isEditMode ? 'تعديل بيانات ولي الأمر والطفل' : 'إنشاء حساب ولي أمر جديد' }}</h1>
      <p class="subtitle">{{ isEditMode ? 'عدّل أي حقل ثم احفظ التغييرات' : 'سجل بيانات ولي الأمر وطفله لإدارة التطعيمات بكل سهولة' }}</p>
    </div>

    <div class="form-card">
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
          <span class="step-label">الموقع الجغرافي</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" @focusin="handleFocusIn">
        <section class="form-section" data-step="1">
          <h2><i class="ti ti-user"></i> بيانات ولي الأمر</h2>
          <div class="grid-2">
            <label class="form-field">
              <span>الاسم الكامل</span>
              <input v-model.trim="guardian.fullName" type="text" required />
            </label>
            <label class="form-field">
              <span>رقم الهوية الوطنية</span>
              <input v-model.trim="guardian.nationalId" type="text" maxlength="11" required />
              <span v-if="errors.nationalId" class="field-error">{{ errors.nationalId }}</span>
            </label>
            <label class="form-field">
              <span>البريد الإلكتروني</span>
              <input v-model.trim="guardian.email" type="email" required />
            </label>
            <label class="form-field">
              <span>رقم الجوال</span>
              <input v-model.trim="guardian.phone" type="tel" maxlength="10" placeholder="09XXXXXXXX" required />
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </label>
          </div>
          <label class="form-field">
            <span>كلمة المرور</span>
            <input v-model="guardian.password" type="password" minlength="8" placeholder="8 أحرف وأرقام على الأقل" />
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </label>
        </section>

        <section class="form-section" data-step="2">
          <h2><i class="ti ti-baby-carriage"></i> بيانات الطفل</h2>
          <div class="grid-2">
            <label class="form-field">
              <span>الاسم الكامل</span>
              <input v-model.trim="child.fullName" type="text" required />
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
            <label class="form-field">
              <span>الطول (سم)</span>
              <input v-model.number="child.height" type="number" min="0" />
            </label>
            <label class="form-field">
              <span>الوزن (كجم)</span>
              <input v-model.number="child.weight" type="number" min="0" step="0.1" />
            </label>
            <label class="form-field">
              <span>زمرة الدم</span>
              <!-- تم تعديل v-model هنا ليصبح child.bloodType -->
              <select v-model="child.bloodType">
                <option value="" disabled>اختر زمرة الدم</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="غير محدد">غير محدد</option>
              </select>
            </label>
          </div>
        </section>

        <section class="form-section" data-step="3">
          <h2><i class="ti ti-map-pin"></i> الموقع الجغرافي</h2>
          <div class="grid-2">
            <label class="form-field">
              <span>المحافظة</span>
              <GovernorateSelect v-model="location.city" />
            </label>
            <label class="form-field">
              <span>المنطقة</span>
              <input v-model.trim="location.district" type="text" required />
            </label>
          </div>
        </section>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="form-actions">
         <button type="button" class="btn btn-outline" @click="cancelEdit">إلغاء</button>
          <button type="submit" class="btn btn-primary">{{ isEditMode ? 'حفظ التعديلات' : 'حفظ الحساب' }}</button>
        </div>
      </form>
    </div>
  </DoctorLayout>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import GovernorateSelect from '../../components/GovernorateSelect.vue'
import { useGuardiansStore } from '../../stores/guardians'
import { useChildrenStore } from '../../stores/children'

const route = useRoute()
const router = useRouter()
const guardiansStore = useGuardiansStore()
const childrenStore = useChildrenStore()

const isEditMode = ref(false)
const editingChildId = ref(null)
const currentStep = ref(1)

const guardian = reactive({ fullName: '', nationalId: '', email: '', phone: '', password: '' })
const child = reactive({ fullName: '', birthDate: '', gender: '', height: null, weight: null, bloodType: '' })
const location = reactive({ city: '', district: '' })

const errors = reactive({ nationalId: '', phone: '', password: '' })
const formError = ref('')

const NATIONAL_ID_REGEX = /^\d{11}$/
const SYRIAN_PHONE_REGEX = /^09\d{8}$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

onMounted(async () => {
  const childId = route.params.childId
  if (!childId) return

  if (childrenStore.children.length === 0) {
    await childrenStore.fetchDoctorChildren()
  }

  const existingChild = childrenStore.getChildById(childId)
  if (!existingChild) return

  isEditMode.value = true
  editingChildId.value = childId

  guardian.fullName = existingChild.guardianName || ''
  guardian.nationalId = existingChild.guardianNationalId || ''
  guardian.phone = existingChild.guardianPhone || ''
  if (existingChild.parent) {
    guardian.email = existingChild.parent.email || ''
    location.city = existingChild.parent.city || ''
    location.district = existingChild.parent.district || ''
  }

  Object.assign(child, {
    fullName: existingChild.fullName,
    birthDate: existingChild.birthDate,
    gender: existingChild.gender,
    height: existingChild.height,
    weight: existingChild.weight,
    bloodType: existingChild.bloodType
  })
})

function cancelEdit() {
  router.push('/doctor/children')
}

function handleFocusIn(e) {
  const section = e.target.closest('[data-step]')
  if (section) currentStep.value = Number(section.dataset.step)
}

function validate() {
  errors.nationalId = NATIONAL_ID_REGEX.test(guardian.nationalId) ? '' : 'يجب أن يتكون من 11 رقمًا بالضبط'
  if (!errors.nationalId && !isEditMode.value && guardiansStore.isNationalIdTaken(guardian.nationalId)) {
    errors.nationalId = 'هذا الرقم الوطني مسجّل بحساب موجود مسبقًا'
  }
  errors.phone = SYRIAN_PHONE_REGEX.test(guardian.phone) ? '' : 'يجب أن يبدأ بـ 09 ويتكون من 10 أرقام'
  if (!isEditMode.value || guardian.password) {
    errors.password = PASSWORD_REGEX.test(guardian.password) ? '' : 'يجب أن تتكون من 8 رموز على الأقل (أحرف وأرقام معًا)'
  } else {
    errors.password = ''
  }
  if (child.height < 0) child.height = 0
  if (child.weight < 0) child.weight = 0 
  return !errors.nationalId && !errors.phone && !errors.password
}

async function handleSubmit() {
  formError.value = ''
  if (!validate()) {
    formError.value = 'الرجاء تصحيح الحقول المظللة'
    return
  }

  try {
    if (isEditMode.value) {
      const existingChild = childrenStore.getChildById(editingChildId.value)
      
      // Update parent if parent_id exists
      if (existingChild && existingChild.parent_id) {
        await guardiansStore.updateGuardian(existingChild.parent_id, {
          fullName: guardian.fullName,
          email: guardian.email,
          password: guardian.password,
          nationalId: guardian.nationalId,
          phone: guardian.phone
        })
      }

      // Update child
      await childrenStore.updateChild(editingChildId.value, {
        name: child.fullName,
        birth_date: child.birthDate,
        gender: child.gender,
        height: child.height || null,
        weight: child.weight || null
      }, true) // true for isDoctor
      
      router.push('/doctor/children')
    } else {
      // Create mode
      const parentRes = await guardiansStore.addGuardian({
        fullName: guardian.fullName,
        email: guardian.email,
        password: guardian.password || 'Parent123',
        nationalId: guardian.nationalId,
        phone: guardian.phone
      })

      const parentId = parentRes?.id || parentRes?.parent?.id

      await childrenStore.addChild({
        name: child.fullName,
        birth_date: child.birthDate,
        gender: child.gender,
        height: child.height || null,
        weight: child.weight || null,
        parent_id: parentId
      }, true)

      router.push('/doctor/children')
    }
  } catch (err) {
    formError.value = err.message || 'حدث خطأ أثناء حفظ التغييرات'
  }
}
</script>

<style scoped>
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
  width: 80px;
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

.page-header { margin-bottom: 20px; }
.page-header h1 { margin: 0 0 4px; font-size: 20px; }
.subtitle { margin: 0; font-size: 13px; color: var(--color-text-muted); }

.form-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  width: 100%;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.form-section:last-of-type { border-bottom: none; }

.form-section h2 {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  color: var(--color-primary-dark);
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 14px;
}

.form-field input, .form-field select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}
.form-field input:focus, .form-field select:focus { border-color: var(--color-primary); }

.field-error { color: var(--color-danger); font-size: 12px; }
.form-error { color: var(--color-danger); font-size: 13px; margin-bottom: 12px; }

.form-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-primary, .btn-secondary {
  flex: 1; text-align: center; padding: 12px 0; border-radius: 8px; font-weight: 500; cursor: pointer;
}

.btn-secondary { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); }
@media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }
</style>