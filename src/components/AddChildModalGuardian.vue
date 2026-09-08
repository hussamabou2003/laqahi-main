<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>إضافة طفل جديد</h3>
        <button type="button" class="modal-close" @click="$emit('close')" aria-label="إغلاق">
          <i class="ti ti-x"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- حقل الرقم الوطني (معطل ومقروء فقط) -->
        <label class="form-field">
          <span>رقمك الوطني</span>
          <input 
            v-model="form.guardianNationalId" 
            type="text" 
            disabled 
            class="disabled-input"
          />
        </label>

        <label class="form-field">
          <span>الاسم الكامل للطفل</span>
          <input v-model.trim="form.fullName" type="text" required />
        </label>

        <label class="form-field">
          <span>المركز الصحي المقرب</span>
          <select v-model="form.centerId" required>
            <option disabled value="">اختر المركز الصحي</option>
            <option v-for="center in centers" :key="center.id" :value="center.id">
              {{ center.name }} ({{ center.location || center.address || '' }})
            </option>
          </select>
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

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">إلغاء</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'جارٍ الحفظ...' : 'حفظ طفلي' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useChildrenStore } from '../stores/children'
import { useAuthStore } from '../stores/auth' 
import { useCentersStore } from '../stores/centers'

const emit = defineEmits(['close', 'saved'])

const childrenStore = useChildrenStore()
const authStore = useAuthStore()
const centersStore = useCentersStore()

const centers = ref([])
const loading = ref(false)

const form = reactive({ 
  guardianNationalId: '', 
  fullName: '', 
  centerId: '',
  birthDate: '', 
  gender: ''
})
const error = ref('')

onMounted(async () => {
  if (authStore.currentUser) {
    form.guardianNationalId = authStore.currentUser.nationalId || authStore.currentUser.id || ''
  }
  try {
    centers.value = await centersStore.fetchCenters()
    if (centers.value.length > 0) {
      form.centerId = centers.value[0].id
    }
  } catch (e) {
    // ignore
  }
})

async function handleSubmit() {
  error.value = ''

  if (!form.centerId) {
    error.value = 'يرجى اختيار المركز الصحي'
    return
  }

  loading.value = true
  try {
    await childrenStore.addChild({
      name: form.fullName,
      birth_date: form.birthDate,
      gender: form.gender,
      center_id: form.centerId
    }, false)
    emit('saved')
  } catch (err) {
    error.value = err.message || 'حدث خطأ أثناء إضافة الطفل'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal-box { background: var(--color-card, #fff); border-radius: var(--radius-lg, 12px); width: 100%; max-width: 420px; padding: 24px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.modal-header h3 { margin: 0; font-size: 17px; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.form-field input, .form-field select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 14px; }
.disabled-input { background-color: #f1f5f9; color: #64748b; cursor: not-allowed; border-color: #cbd5e1 !important; }
.form-error { color: #ef4444; font-size: 13px; }
.modal-actions { display: flex; gap: 12px; margin-top: 4px; }
.btn-primary, .btn-secondary { flex: 1; padding: 10px 0; border-radius: 8px; font-weight: 500; cursor: pointer; }
.btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; }

</style>