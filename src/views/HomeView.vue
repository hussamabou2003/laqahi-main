<template>
  <div class="landing-page">
    <!-- شريط التنقل الخاص بالصفحة الرئيسية -->
    <AppHeader />

    <main>
      <!-- أقسام الصفحة الرئيسية -->
      <HeroSection />
      <WhySection />
      <NewsSection />
    </main>

    <!-- تذييل الصفحة -->
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue'
import HeroSection from '../components/HeroSection.vue'
import WhySection from '../components/WhySection.vue'
import NewsSection from '../components/NewsSection.vue'
import AppFooter from '../components/AppFooter.vue'
</script>

<style scoped>

.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1;
}
</style>