<script setup>
import { ref } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { useAuditStore } from '../../stores/audit'
import { getToken } from '../../utils/api'

const auth = useAuthStore()
const toast = useToastStore()
const audit = useAuditStore()

const backupFormat = ref('json')
const isDownloading = ref(false)

async function triggerBackup() {
  if (isDownloading.value) return
  isDownloading.value = true
  
  try {
    const token = getToken()
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/backup?format=${backupFormat.value}`, {
      headers
    })
    
    if (!res.ok) throw new Error('فشل جلب النسخة الاحتياطية')
    
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const ext = backupFormat.value === 'sql' ? 'sql' : 'json'
    a.download = `laqahi_backup_${new Date().toISOString().split('T')[0]}.${ext}`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('تم بنجاح', `تم تحميل النسخة الاحتياطية بصيغة ${ext.toUpperCase()} بنجاح.`)
    audit.log('system', 'النسخ الاحتياطي', `سحب نسخة احتياطية بصيغة ${ext.toUpperCase()}`, auth.user?.name)
  } catch (err) {
    toast.error('خطأ', 'فشل تحميل النسخة الاحتياطية')
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <div>
        <h1 class="page-head__title">النسخ الاحتياطي</h1>
        <p class="page-head__subtitle">سحب نسخ احتياطية لقاعدة بيانات النظام للاحتفاظ بها أو نقلها.</p>
      </div>
    </div>

    <div class="backup-container">
      <section class="card backup-card">
        <span class="backup-card__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M4 7a8 8 0 1 1 1.5 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M4 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <h2 class="backup-card__title">النسخ الاحتياطي</h2>
        <p class="backup-card__status">{{ new Date().toLocaleDateString('ar-SA') }}</p>

        <div class="format-selection">
          <label class="radio-label">
            <input type="radio" value="json" v-model="backupFormat" />
            <span class="radio-text">صيغة JSON</span>
          </label>
          <label class="radio-label">
            <input type="radio" value="sql" v-model="backupFormat" />
            <span class="radio-text">صيغة MySQL</span>
          </label>
        </div>

        <button class="btn btn-primary backup-card__btn" :disabled="isDownloading" @click="triggerBackup">
          <span v-if="isDownloading">جاري التحميل...</span>
          <span v-else>سحب نسخة الآن</span>
        </button>
      </section>
    </div>
  </AdminLayout>
</template>

<style scoped>
.backup-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.backup-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: var(--color-surface-muted);
  width: 100%;
  max-width: 500px;
}

.backup-card__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-white);
  color: var(--color-green-800);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.backup-card__title {
  font-size: 16px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  font-weight: 700;
}

.backup-card__status {
  font-weight: 800;
  font-size: 20px;
  margin-bottom: 24px;
}

.format-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  background: var(--color-white);
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-text {
  font-size: 14px;
  font-weight: 600;
}

.backup-card__btn {
  width: 100%;
  max-width: 300px;
  font-size: 15px;
  padding: 12px;
}
</style>
