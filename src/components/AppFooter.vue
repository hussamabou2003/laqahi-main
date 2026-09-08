<script setup>
const currentYear = new Date().getFullYear()

const helpLinks = ['اتصل بنا', 'سياسة الخصوصية', 'الشروط والأحكام', 'بلاغات الدعم الفني']
const quickLinks = ['عن النظام', 'اللقاحات المتاحة', 'المراكز الصحية', 'الأسئلة الشائعة']
</script>

<template>
  <footer class="footer" id="footer">
    <div class="container footer__grid">
      <!-- تواصل معنا -->
      <div class="footer__col">
        <h4 class="footer__title">تواصل معنا</h4>
        <div class="footer__contact">
          <a href="#" class="footer__icon-btn" aria-label="الموقع الإلكتروني">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke="currentColor" stroke-width="1.6"/>
            </svg>
          </a>
          <a href="tel:115" class="footer__icon-btn" aria-label="اتصل بنا">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
          </a>
          <a href="mailto:info@laqahi.sy" class="footer__icon-btn" aria-label="البريد الإلكتروني">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
              <path d="m3 7 9 6 9-6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
        <p class="footer__emergency">رقم الطوارئ: <strong>115</strong></p>
      </div>

      <!-- الدعم والمساعدة -->
      <div class="footer__col">
        <h4 class="footer__title">الدعم والمساعدة</h4>
        <ul class="footer__list">
          <li v-for="l in helpLinks" :key="l"><a href="#">{{ l }}</a></li>
        </ul>
      </div>

      <!-- روابط سريعة -->
      <div class="footer__col">
        <h4 class="footer__title">روابط سريعة</h4>
        <ul class="footer__list">
          <li v-for="l in quickLinks" :key="l"><a href="#">{{ l }}</a></li>
        </ul>
      </div>

      <!-- عن لقاحي -->
      <div class="footer__col footer__col--about">
        <h4 class="footer__title">لقاحي</h4>
        <p class="footer__about">
          المنصة الوطنية الذكية لإدارة ومتابعة تحصينات الأطفال، تهدف إلى تعزيز الصحة العامة وبناء
          مستقبل خالٍ من الأمراض.
        </p>
      </div>
    </div>

    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <p>© {{ currentYear }} نظام لقاحي للتحصينات الذكية. جميع الحقوق محفوظة.</p>
        <div class="footer__bottom-links">
          <a href="#">اتصل بنا</a>
          <a href="#">سياسة الخصوصية</a>
          <a href="#">الشروط والأحكام</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-white);
  border-top: 1px solid var(--color-gray-100);
  margin-top: 40px;
}

.footer__grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.4fr;
  gap: 32px;
  padding: 64px 24px 48px;
}

.footer__title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 20px;
}

.footer__contact {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.footer__icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-teal-800);
  transition: background 0.15s ease;
}

.footer__icon-btn:hover {
  background: var(--color-green-100);
}

.footer__emergency {
  font-size: 14px;
  color: var(--color-text-muted);
}

.footer__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.footer__list a {
  font-size: 14.5px;
  color: var(--color-text-muted);
  transition: color 0.15s ease;
}

.footer__list a:hover {
  color: var(--color-teal-800);
}

.footer__about {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.9;
  max-width: 320px;
}

.footer__bottom {
  border-top: 1px solid var(--color-gray-100);
}

.footer__bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 24px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.footer__bottom-links {
  display: flex;
  gap: 20px;
}

@media (max-width: 900px) {
  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
