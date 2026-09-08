<template>
  <div class="app-shell">
    <AppSidebar @add-child="showAddChildModal = true" />

    <main class="main-content">
      <slot/>

      <footer class="app-footer">
        <div class="footer-links">
          <a href="#">سياسة الخصوصية</a>
          <a href="#">الشروط والأحكام</a>
          <a href="#">اتصل بنا</a>
        </div>
        <p>© 2026 نظام لقاحي للتحصينات. جميع الحقوق محفوظة.</p>
      </footer>
    </main>

    <AddChildModalGuardian @add-child="handleAddChild"
  v-if="showAddChildModal"
  @close="showAddChildModal = false"
  @saved="showAddChildModal = false"
/>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AddChildModalGuardian from '../components/AddChildModalGuardian.vue'
import { useChildrenStore } from '../stores/children'
import { useAuthStore } from '../stores/auth'
const authStore = useAuthStore()
const showAddChildModal = ref(false)
const childrenStore = useChildrenStore()

function handleAddChild(childData) {
  childrenStore.addChild({
    ...childData,
    guardianNationalId: authStore.currentUser?.nationalId
  })

  showAddChildModal.value = false
}
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 6px;
}

.footer-links a {
  color: var(--color-text-muted);
}

@media (max-width: 900px) {
  .app-shell {
    flex-direction: column;
    background-color: var(--color-bg);
  }
  .app-shell > :deep(.sidebar) {
    width: 100%;
    min-height: auto;
  }
  .main-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 12px;
  }
}
</style>