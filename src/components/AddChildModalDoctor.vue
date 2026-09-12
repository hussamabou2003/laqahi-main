<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>إضافة طفل جديد (لوحة الطبيب)</h3>
        <button type="button" class="modal-close" @click="$emit('close')" aria-label="إغلاق">
          <i class="ti ti-x"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- حقل الرقم الوطني (متاح للتعديل للطبيب) -->
        <label class="form-field">
          <span>الرقم الوطني لولي الأمر</span>
          <input 
            v-model.trim="form.guardianNationalId" 
            type="text" 
            inputmode="numeric" 
            maxlength="11" 
            placeholder="أدخل 11 رقمًا" 
            required 
          />
          <span v-if="guardianPreview" class="guardian-found">
            <i class="ti ti-circle-check"></i> ولي الأمر: {{ guardianPreview.fullName || guardianPreview.name }}
          </span>
        </label>

        <label class="form-field">
          <span>اسم ولي الأمر</span>
          <input 
            type="text" 
            :value="guardianPreview ? (guardianPreview.fullName || guardianPreview.name) : ''"
            placeholder="يظهر تلقائياً عند إدخال رقم وطني صحيح"
            readonly
            disabled
          />
        </label>

        <label class="form-field">
          <span>الاسم الكامل للطفل</span>
          <input v-model.trim="form.fullName" type="text" required />
        </label>

        <label class="form-field">
          <span>تاريخ الميلاد</span>
          <input v-model="form.birthDate" type="date" required />
        </label>

        <label class="form-field">
          <span>الجنس</span>
          <select v-model="form.gender" required>
            <option disabled value="">اختر الجنس</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </label>

        <!-- الحقول الإضافية الخاصة بالطبيب -->
        <div class="row-fields">
          <label class="form-field">
            <span>الطول (سم)</span>
            <input v-model="form.height" type="number" placeholder="مثال: 50" />
          </label>
          
          <label class="form-field">
            <span>الوزن (كغ)</span>
            <input v-model="form.weight" type="number" step="0.1" placeholder="مثال: 3.5" />
          </label>
        </div>

        <label class="form-field">
          <span>زمرة الدم</span>
          <select v-model="form.bloodType">
            <option value="">غير محدد</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">إلغاء</button>
          <button type="submit" class="btn btn-primary">حفظ الطفل</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { getGuardianByNationalIdApi } from '../utils/api'
import { useChildrenStore } from '../stores/children'

const emit = defineEmits(['close', 'saved'])

const childrenStore = useChildrenStore()

const form = reactive({ 
  guardianNationalId: '', 
  fullName: '', 
  birthDate: '', 
  gender: '',
  height: '',
  weight: '',
  bloodType: ''
})
const error = ref('')
const guardianPreview = ref(null)

const NATIONAL_ID_REGEX = /^\d{11}$/

watch(() => form.guardianNationalId, async (newVal) => {
  if (NATIONAL_ID_REGEX.test(newVal)) {
    try {
      error.value = ''
      const res = await getGuardianByNationalIdApi(newVal)
      if (res) {
        guardianPreview.value = res
      } else {
        guardianPreview.value = null
        error.value = 'لا يوجد ولي أمر مسجّل بهذا الرقم الوطني'
      }
    } catch (e) {
      guardianPreview.value = null
      if (e.status === 404) {
        error.value = 'لا يوجد ولي أمر مسجّل بهذا الرقم الوطني'
      } else {
        error.value = e.message || 'حدث خطأ أثناء البحث عن ولي الأمر'
      }
    }
  } else {
    guardianPreview.value = null
  }
})

async function handleSubmit() {
  error.value = ''

  if (!NATIONAL_ID_REGEX.test(form.guardianNationalId)) {
    error.value = 'الرقم الوطني يجب أن يتكون من 11 رقمًا بالضبط'
    return
  }

  if (!guardianPreview.value) {
    error.value = 'لا يوجد ولي أمر مسجّل بهذا الرقم الوطني'
    return
  }

  const guardian = guardianPreview.value



  try {
    await childrenStore.addChild({
      parent_id: guardian.id,
      name: form.fullName,
      birth_date: form.birthDate,
      gender: form.gender,
      height: form.height || null,
      weight: form.weight || null,
      blood_type: form.bloodType || null
    }, true)
    emit('saved')
  } catch (e) {
    error.value = e.message || 'حدث خطأ أثناء إضافة الطفل'
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal-box { background: var(--color-card, #fff); border-radius: var(--radius-lg, 12px); width: 100%; max-width: 420px; padding: 24px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; font-size: 17px; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.row-fields { display: flex; gap: 12px; }
.row-fields .form-field { flex: 1; }
.form-field { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.form-field input, .form-field select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 14px; }
.guardian-found { font-size: 12px; color: #0f766e; display: flex; align-items: center; gap: 4px; }
.form-error { color: #ef4444; font-size: 13px; }
.modal-actions { display: flex; gap: 12px; margin-top: 4px; }
.btn-primary, .btn-secondary { flex: 1; padding: 10px 0; border-radius: 8px; font-weight: 500; cursor: pointer; }
.btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; }
</style>