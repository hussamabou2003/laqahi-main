<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useAuditStore } from '../../stores/audit'
import { exportCSV, exportPDF } from '../../utils/export'
import { useToastStore } from '../../stores/toast'

const audit = useAuditStore()
const toast = useToastStore()

const search = ref('')
const typeFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

function parseEntryDate(entry) {
  const [datePart] = entry.time.split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const filtered = computed(() => {
  return audit.entries.filter((e) => {
    const matchesType = typeFilter.value === 'all' || e.type === typeFilter.value
    const q = search.value.trim()
    const matchesSearch = !q || e.details.includes(q) || e.actor.includes(q)

    let matchesDate = true
    if (dateFrom.value || dateTo.value) {
      const entryDate = parseEntryDate(e)
      if (dateFrom.value && entryDate < new Date(dateFrom.value)) matchesDate = false
      if (dateTo.value && entryDate > new Date(`${dateTo.value}T23:59:59`)) matchesDate = false
    }

    return matchesType && matchesSearch && matchesDate
  })
})

function resetFilters() {
  search.value = ''
  typeFilter.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
}

const headers = ['التاريخ والوقت', 'النوع', 'المستخدم', 'التفاصيل']

function rowsForExport() {
  return filtered.value.map((e) => [e.time, e.typeLabel, e.actor, e.details])
}

function handleExportCSV() {
  exportCSV('سجل-التدقيق-لقاحي', headers, rowsForExport())
  toast.success('تم التصدير', 'تم تنزيل ملف CSV بنجاح.')
}

function handleExportPDF() {
  exportPDF('سجل التدقيق - نظام لقاحي', headers, rowsForExport(), 'سجل-التدقيق-لقاحي')
  toast.success('تم التصدير', 'تم تنزيل ملف PDF بنجاح.')
}

const typeIcons = {
  login: '#2f7fe0',
  doctor: '#22b06a',
  center: '#2bc37a',
  report: '#7c6ee8',
  settings: '#93a19c'
}
</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <div>
        <h1 class="page-head__title">سجل التدقيق</h1>
        <p class="page-head__subtitle">سجل كامل لجميع العمليات الحساسة التي جرت داخل النظام.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn-outline" @click="handleExportCSV">
          تصدير CSV
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="btn btn-primary" @click="handleExportPDF">
          تصدير PDF
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M7 3h7l4 4v14H7Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M10 13h4M10 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <section class="card box-pad">
      <div class="filters">
        <label class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input v-model="search" type="text" placeholder="ابحث في التفاصيل أو اسم المستخدم..." />
        </label>

        <select v-model="typeFilter" class="type-select">
          <option value="all">كل الأنواع</option>
          <option v-for="t in audit.types" :key="t.type" :value="t.type">{{ t.label }}</option>
        </select>

        <div class="date-range">
          <input v-model="dateFrom" type="date" class="type-select" aria-label="من تاريخ" />
          <span class="date-range__sep">إلى</span>
          <input v-model="dateTo" type="date" class="type-select" aria-label="إلى تاريخ" />
        </div>

        <button v-if="search || typeFilter !== 'all' || dateFrom || dateTo" class="clear-filters" @click="resetFilters">
          مسح الفلاتر ✕
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>التاريخ والوقت</th>
            <th>النوع</th>
            <th>المستخدم</th>
            <th>التفاصيل</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.id">
            <td class="cell-muted" dir="ltr">{{ e.time }}</td>
            <td>
              <span class="type-chip">
                <span class="type-chip__dot" :style="{ background: typeIcons[e.type] || '#93a19c' }"></span>
                {{ e.typeLabel }}
              </span>
            </td>
            <td class="cell-strong">{{ e.actor }}</td>
            <td class="cell-muted">{{ e.details }}</td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="4" class="empty-row">لا توجد نتائج مطابقة لمعايير البحث الحالية.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </AdminLayout>
</template>

<style scoped>
.box-pad {
  padding: 26px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface-muted);
  border-radius: 12px;
  padding: 10px 14px;
  color: var(--color-text-muted);
  flex: 1;
  min-width: 220px;
}

.search input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: var(--color-text);
}

.type-select {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  font-size: 13.5px;
  color: var(--color-text);
  min-width: 160px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range .type-select {
  min-width: 150px;
}

.date-range__sep {
  font-size: 12.5px;
  color: var(--color-text-soft);
  flex-shrink: 0;
}

.clear-filters {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-muted);
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-surface-muted);
  flex-shrink: 0;
}

.clear-filters:hover {
  color: var(--color-danger-600);
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.type-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cell-strong {
  font-weight: 700;
}

.cell-muted {
  color: var(--color-text-muted);
}

.empty-row {
  text-align: center;
  color: var(--color-text-muted);
  padding: 30px 0;
}
</style>
