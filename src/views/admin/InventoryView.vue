<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useInventoryStore } from '../../stores/inventory'
import { useCentersStore } from '../../stores/centers'
import { useVaccinesStore } from '../../stores/vaccines'

const inventoryStore = useInventoryStore()
const centersStore = useCentersStore()
const vaccinesStore = useVaccinesStore()
const items = computed(() => inventoryStore.list)
const form = reactive({ center_id: '', vaccine_id: '', quantity: 0, min_threshold: 10 })
const error = ref('')

onMounted(async () => {
  await Promise.all([inventoryStore.fetchInventory(), centersStore.fetchCenters(true), vaccinesStore.fetchVaccines()])
  form.center_id = centersStore.list[0]?.id || ''
  form.vaccine_id = vaccinesStore.list[0]?.id || ''
})

async function saveInventory() {
  error.value = ''
  try {
    await inventoryStore.addStock({ ...form })
  } catch (err) {
    error.value = err.message || 'تعذر حفظ المخزون'
  }
}
</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <div>
        <h1 class="page-head__title">مخزون اللقاحات</h1>
        <p class="page-head__subtitle">الكميات المسجلة فعليًا لكل مركز ولقاح.</p>
      </div>
    </div>
    
    <section class="card panel">
      <h2 class="panel__title">تحديث سجل مخزون</h2>
      <form class="inventory-form" @submit.prevent="saveInventory">
        <div class="form-grid">
          <div class="form-group">
            <label>المركز الصحي</label>
            <select class="form-control" v-model="form.center_id" required>
              <option disabled value="">اختر المركز</option>
              <option v-for="center in centersStore.list" :key="center.id" :value="center.id">{{ center.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>نوع اللقاح</label>
            <select class="form-control" v-model="form.vaccine_id" required>
              <option disabled value="">اختر اللقاح</option>
              <option v-for="vaccine in vaccinesStore.list" :key="vaccine.id" :value="vaccine.id">{{ vaccine.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>الكمية المتوفرة</label>
            <input class="form-control" v-model.number="form.quantity" type="number" min="0" required placeholder="مثال: 50" />
          </div>

          <div class="form-group">
            <label>الحد الأدنى للتنبيه</label>
            <input class="form-control" v-model.number="form.min_threshold" type="number" min="0" required placeholder="مثال: 10" />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary submit-btn" type="submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M4 7v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7M9 11v4M15 11v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            حفظ المخزون
          </button>
        </div>
      </form>
      <p v-if="error" class="form-error">{{ error }}</p>
    </section>

    <section class="card panel">
      <h2 class="panel__title">قائمة المخزون الحالية</h2>
      <table class="table">
        <thead><tr><th>المركز</th><th>اللقاح</th><th>الكمية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><strong style="color: var(--color-teal-800)">{{ item.center?.name || 'غير محدد' }}</strong></td>
            <td>{{ item.vaccine?.name || 'غير محدد' }}</td>
            <td><strong style="font-size: 15px;">{{ item.quantity }}</strong></td>
            <td>{{ item.min_threshold }}</td>
            <td><span class="badge" :class="item.is_low_stock ? 'badge-danger' : 'badge-success'">{{ item.is_low_stock ? 'منخفض' : 'متوفر' }}</span></td>
          </tr>
          <tr v-if="!items.length"><td colspan="5">لا توجد سجلات مخزون حتى الآن.</td></tr>
        </tbody>
      </table>
    </section>
  </AdminLayout>
</template>

<style scoped>
.panel {
  padding: 24px;
  margin-bottom: 24px;
}

.panel__title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 22px;
  color: var(--color-teal-900);
}

.inventory-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text-strong);
}

.form-control {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text);
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  font-family: inherit;
}

.form-control:focus {
  border-color: var(--color-green-800);
  box-shadow: 0 0 0 3px var(--color-green-100);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-gray-100);
  padding-top: 20px;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 14.5px;
  font-weight: 700;
  border-radius: 10px;
}

.form-error {
  margin-top: 16px;
  color: var(--color-danger-600);
  font-size: 13.5px;
  font-weight: 600;
  background: var(--color-danger-100);
  padding: 12px;
  border-radius: 8px;
}
</style>
