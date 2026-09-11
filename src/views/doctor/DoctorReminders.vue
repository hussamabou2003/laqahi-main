<template>
  <DoctorLayout>
    <div class="page-header">
      <div class="header-text">
        <h1>التذكيرات</h1>
        <p class="welcome-text">إرسال رسائل تذكير أو تنبيهات يدوية لأولياء الأمور</p>
      </div>
    </div>

    <div class="reminders-container">
      <section class="card form-card">
        <h2>رسالة تذكير جديدة</h2>
        <p class="form-desc">اختر الطفل وسيتم إرسال الرسالة إلى ولي أمره عبر النظام أو البريد الإلكتروني.</p>

        <form @submit.prevent="sendReminder" class="reminder-form">
          <div class="form-group">
            <label>الطفل / ولي الأمر</label>
            <div class="custom-select-wrapper">
              <select v-model="selectedChildId" required class="form-control">
                <option value="" disabled>-- اختر الطفل --</option>
                <option v-for="child in childrenStore.children" :key="child.id" :value="child.id">
                  {{ child.fullName }} (ولي الأمر: {{ child.guardianName || 'غير مسجل' }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>موضوع الرسالة</label>
            <input type="text" v-model="subject" required class="form-control" placeholder="مثال: تذكير بموعد الجرعة القادمة" />
          </div>

          <div class="form-group">
            <label>محتوى الرسالة</label>
            <textarea v-model="message" required class="form-control" rows="5" placeholder="اكتب رسالتك هنا..."></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSending">
              <i class="ti ti-send"></i>
              <span>{{ isSending ? 'جاري الإرسال...' : 'إرسال التذكير' }}</span>
            </button>
          </div>
          
          <div v-if="successMessage" class="alert success-alert">
            <i class="ti ti-circle-check"></i>
            <span>{{ successMessage }}</span>
          </div>

          <div v-if="errorMessage" class="alert error-alert">
            <i class="ti ti-alert-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </form>
      </section>

      <!-- إضافة أوقات متاحة للمواعيد -->
      <section class="card availability-card">
        <div class="availability-header">
          <h2>إضافة أوقات متاحة للمواعيد</h2>
          <p class="form-desc">لوضع مواعيد تتاح مستقبلاً أو في نفس اليوم.</p>
        </div>
        <div class="availability-content">
          <form class="availability-form" @submit.prevent="handleAddSlot">
            <div class="form-row-inline">
              <label class="form-field">
                <span>التاريخ</span>
                <input v-model="newSlot.date" type="date" :min="todayStr" required class="form-control" />
              </label>
              <label class="form-field">
                <span>الوقت</span>
                <input v-model="newSlot.time" type="time" required class="form-control" />
              </label>
            </div>
            <button type="submit" class="btn btn-primary" style="align-self: flex-start; margin-top: 10px;">إضافة الوقت</button>
          </form>

          <div class="slots-scroll-area">
            <ul v-if="availabilityStore.slots?.length" class="slots-preview horizontal-slots">
              <li v-for="slot in availabilityStore.slots" :key="slot.id">
                <span>{{ formatDate(slot.date) }} - {{ slot.time }}</span>
                <button type="button" @click="availabilityStore.removeSlot(slot.id)" aria-label="حذف" class="btn-delete-slot">
                  <i class="ti ti-trash"></i>
                </button>
              </li>
            </ul>
            <p v-else class="no-slots">لا توجد أوقات متاحة مضافة.</p>
          </div>
        </div>
      </section>
    </div>
  </DoctorLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import DoctorLayout from '../../layouts/DoctorLayout.vue'
import { useChildrenStore } from '../../stores/children'
import { useAvailabilityStore } from '../../stores/availability'
import { sendManualNotificationApi } from '../../utils/api'

const childrenStore = useChildrenStore()
const availabilityStore = useAvailabilityStore()

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const newSlot = reactive({ date: '', time: '' })

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })
}

function handleAddSlot() {
  if (!newSlot.date || !newSlot.time) return
  availabilityStore.addSlot(newSlot.date, newSlot.time)
  Object.assign(newSlot, { date: '', time: '' })
}

const selectedChildId = ref('')
const subject = ref('')
const message = ref('')
const isSending = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  if (!childrenStore.children.length) {
    await childrenStore.fetchDoctorChildren()
  }
})

async function sendReminder() {
  if (!selectedChildId.value || !subject.value || !message.value) return
  
  isSending.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // ندمج الموضوع مع الرسالة لأن الباك إند يقبل حقل message فقط
    const fullMessage = subject.value + '\n\n' + message.value

    await sendManualNotificationApi({
      child_id: selectedChildId.value,
      message: fullMessage
    })

    successMessage.value = 'تم إرسال التذكير بنجاح إلى ولي الأمر.'
    
    // إعادة تعيين النموذج
    selectedChildId.value = ''
    subject.value = ''
    message.value = ''
    
    // إخفاء رسالة النجاح بعد 3 ثواني
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    errorMessage.value = err.message || 'حدث خطأ أثناء إرسال التذكير.'
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.header-text h1 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: var(--color-text); }
.welcome-text { margin: 0; font-size: 13px; color: var(--color-text-muted); }

.reminders-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
}

.card {
  background: var(--color-card);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--color-border);
}

.form-card h2 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: var(--color-teal-800);
}

.form-desc {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.reminder-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.form-control {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
}

.custom-select-wrapper select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 16px center;
  background-size: 16px;
  padding-left: 40px;
}

textarea.form-control {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-teal-700);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background-color: #dcfce7;
  color: #16a34a;
  font-weight: 600;
  font-size: 14px;
  margin-top: 10px;
}

.success-alert i {
  font-size: 20px;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background-color: #fee2e2;
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
  margin-top: 10px;
}

.error-alert i {
  font-size: 20px;
}
</style>

/* Availability Card Styles */
.availability-card { margin-top: 10px; }
.availability-header h2 { font-size: 18px; color: var(--color-teal-800); margin: 0 0 4px 0; }
.form-row-inline { display: flex; gap: 16px; margin-bottom: 12px; }
.form-row-inline .form-field { flex: 1; display: flex; flex-direction: column; }
.form-row-inline .form-field span { font-size: 13px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 6px; }
.slots-scroll-area { margin-top: 24px; background: var(--color-bg); border: 1px dashed var(--color-border); padding: 16px; border-radius: 12px; }
.horizontal-slots { display: flex; flex-wrap: wrap; gap: 12px; list-style: none; padding: 0; margin: 0; }
.horizontal-slots li { display: flex; align-items: center; gap: 12px; background: var(--color-white); padding: 8px 16px; border-radius: 20px; border: 1px solid var(--color-border); font-size: 14px; font-weight: 600; }
.btn-delete-slot { background: transparent; border: none; color: var(--color-danger); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.btn-delete-slot:hover { background: var(--color-danger-light); }
.no-slots { text-align: center; color: var(--color-text-soft); font-size: 14px; }

