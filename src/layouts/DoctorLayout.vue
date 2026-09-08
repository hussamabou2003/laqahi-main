<template>
  <div class="doctor-layout">
    <!-- الشريط الجانبي للطبيب -->
    <DoctorSidebar />

    <!-- المحتوى الرئيسي للصفحة -->
    <main class="doctor-main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import DoctorSidebar from '../components/DoctorSidebar.vue'
</script>

<style scoped>
.doctor-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 20px;
  gap: 24px;
  direction: rtl;
}

.doctor-main-content {
  overflow-y: auto;
  padding-left: 8px;
}

@media (max-width: 1024px) {
  .doctor-layout {
    grid-template-columns: 1fr;
    padding: 12px;
  }
}
</style>