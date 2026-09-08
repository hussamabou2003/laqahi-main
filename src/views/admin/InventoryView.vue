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
      <form class="inventory-form" @submit.prevent="saveInventory">
        <select v-model="form.center_id" required><option disabled value="">اختر المركز</option><option v-for="center in centersStore.list" :key="center.id" :value="center.id">{{ center.name }}</option></select>
        <select v-model="form.vaccine_id" required><option disabled value="">اختر اللقاح</option><option v-for="vaccine in vaccinesStore.list" :key="vaccine.id" :value="vaccine.id">{{ vaccine.name }}</option></select>
        <input v-model.number="form.quantity" type="number" min="0" required placeholder="الكمية" />
        <input v-model.number="form.min_threshold" type="number" min="0" required placeholder="الحد الأدنى" />
        <button class="btn btn-primary" type="submit">حفظ المخزون</button>
      </form>
      <p v-if="error" class="form-error">{{ error }}</p>
    </section>
    <section class="card panel">
      <table class="table">
        <thead><tr><th>المركز</th><th>اللقاح</th><th>الكمية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.center?.name || 'غير محدد' }}</td>
            <td>{{ item.vaccine?.name || 'غير محدد' }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.min_threshold }}</td>
            <td><span class="badge" :class="item.is_low_stock ? 'badge-danger' : 'badge-success'">{{ item.is_low_stock ? 'منخفض' : 'متوفر' }}</span></td>
          </tr>
          <tr v-if="!items.length"><td colspan="5">لا توجد سجلات مخزون حتى الآن.</td></tr>
        </tbody>
      </table>
    </section>
  </AdminLayout>
</template>
