<template>
  <DashboardLayout>
    <div class="children-page-wrapper">

      <!-- الصف العلوي: العنوان والبحث في اليمين، والزر والرجوع في اليسار -->
      <header class="top-header-row">
        <!-- قسم اليمين: عنوان الصفحة والوصف ومربع البحث -->
        <div class="right-section">
          <h1 class="page-title">أطفالي</h1>
          <p class="page-subtitle">تابع جميع معلومات تطعيمات أطفالك</p>

          <div class="search-box-pill">
            <i class="ti ti-search search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ابحث بالاسم أو رقم الملف..."
            />
          </div>
        </div>

        <!-- قسم اليسار: رابط الرجوع، زر الإضافة، ومؤشر عدد الأطفال -->
        <div class="left-section">
          <router-link to="/dashboard" class="back-link">
            <i class="ti ti-arrow-left"></i> رجوع
          </router-link>

          <button type="button" class="btn btn-primary" @click="showAddChildModal = true">
            <i class="ti ti-plus"></i> إضافة طفل
          </button>

          <span class="count-badge">{{ filteredChildren.length }} من {{ myChildren.length }} طفل</span>
        </div>
      </header>

      <!-- شبكة بطاقات الأطفال -->
      <section v-if="filteredChildren.length" class="cards-grid">
        <ChildCard v-for="child in filteredChildren" :key="child.id" :child="child" :centers="centers" @center-change="changeCenter" />
      </section>

      <!-- حالة عدم وجود بيانات -->
      <section v-else class="empty-state-card">
        <i class="ti ti-mood-empty empty-icon"></i>
        <h3>لا توجد سجلات أطفال مطابقة</h3>
        <p v-if="searchQuery">لم يتم العثور على نتائج للبحث "{{ searchQuery }}"</p>
        <p v-else>ابدأ بإضافة أول طفل لمتابعة جدول تطعيماته الصحية.</p>
      </section>

    </div>

    <!-- نافذة إضافة طفل -->
    <AddChildModalGuardian
      v-if="showAddChildModal"
      @close="showAddChildModal = false"
      @saved="showAddChildModal = false"
    />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ChildCard from '../components/ChildCard.vue'
import AddChildModalGuardian from '../components/AddChildModalGuardian.vue'
import { useChildrenStore } from '../stores/children'
import { useAuthStore } from '../stores/auth'
import { useCentersStore } from '../stores/centers'
import { useToastStore } from '../stores/toast'

const authStore = useAuthStore()
const childrenStore = useChildrenStore()
const centersStore = useCentersStore()
const toast = useToastStore()

const showAddChildModal = ref(false)
const searchQuery = ref('')

onMounted(() => childrenStore.fetchParentChildren())
onMounted(() => centersStore.fetchCenters())

const centers = computed(() => centersStore.list)

async function changeCenter({ childId, centerId }) {
  try {
    await childrenStore.changeChildCenter(childId, Number(centerId))
    toast.success('تم التحديث', 'تم تغيير المركز الصحي للطفل ومواعيده بنجاح.')
  } catch (err) {
    toast.error('تعذر التغيير', err.message || 'حدث خطأ أثناء تغيير المركز الصحي.')
  }
}

const myChildren = computed(() => childrenStore.children)

const filteredChildren = computed(() => {
  if (!searchQuery.value.trim()) return myChildren.value
  const q = searchQuery.value.toLowerCase().trim()
  return myChildren.value.filter(c =>
    (c.fullName || c.name || '').toLowerCase().includes(q) ||
    String(c.nationalId || c.id || '').includes(q)
  )
})
</script>

<style scoped>
.children-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  direction: rtl;
}

/* الرأس العلوي مقسم بالتساوي ومحدد الاتجاه */
.top-header-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

/* قسم اليمين: العنوان ومربع البحث */
.right-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text);
}

.page-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
}

.search-box-pill {
  position: relative;
  width: 320px;
}

.search-box-pill input {
  width: 100%;
  padding: 10px 18px 10px 42px;
  background-color: var(--color-card);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 13px;
  outline: none;
  text-align: right;
  direction: rtl;
}

.search-box-pill input:focus {
  border-color: #0f766e;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 17px;
}

/* قسم اليسار: الرجوع وزر الإضافة والعداد */
.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.back-link {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}



.btn-add-primary:hover {
  opacity: 0.92;
}

.count-badge {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

/* شبكة البطاقات */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty-state-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  padding: 50px 20px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 44px;
  color: #94a3b8;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .top-header-row {
    flex-direction: column;
    gap: 20px;
  }
  .left-section {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .search-box-pill {
    width: 100%;
  }
}
</style>
