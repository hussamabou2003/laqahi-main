<script setup></script>

<template>
  <section class="why" id="about-system">
    <div class="container">
      <div class="why__head">
        <h2 class="section-title">لماذا نهتم باللقاحات؟</h2>
        <p class="section-subtitle">
          اللقاحات هي الدرع الأول لحماية أطفالنا من الأمراض المعدية وتوفير بيئة صحية تساعدهم للنمو
          والازدهار.
        </p>
      </div>

      <div class="why__grid">
        <!-- أمان اللقاحات -->
        <article class="card card--light">
          <div class="card__content">
            <span class="card__icon card__icon--dark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 4 5v6c0 5.2 3.4 9 8 11 4.6-2 8-5.8 8-11V5l-8-3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <h3 class="card__title">أمان اللقاحات</h3>
            <p class="card__desc">
              تخضع جميع اللقاحات المعتمدة في النظام لاختبارات صارمة من قِبل هيئة الغذاء والدواء لضمان
              أعلى مستويات الأمان.
            </p>
          </div>
          <!-- زر اقرأ المزيد بالرابط المطلوب -->
          <a 
            href="https://www.who.int/ar/news-room/questions-and-answers/item/vaccines-and-immunization-what-is-vaccination" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="card__link card__link--dark"
          >
            تعرف أكثر
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </article>

        <!-- المناعة الجماعية -->
        <article class="card card--teal">
          <h3 class="card__title card__title--white">المناعة الجماعية</h3>
          <p class="card__desc card__desc--light">
            عندما يتم تطعيم غالبية أفراد المجتمع، يصعب انتشار الأمراض، مما يحمي الفئات الأكثر عرضة
            للخطر والذين لا يستطيعون تلقي اللقاحات لأسباب طبية.
          </p>
          <a href="https://www.who.int/ar/news-room/questions-and-answers/item/vaccines-and-immunization-what-is-vaccination" target="_blank" class="card__link">
            اقرأ المزيد
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <div class="card__dots">
            <span></span><span></span>
          </div>
        </article>

        <!-- الوقاية من الأمراض -->
        <article class="card card--green">
          <span class="card__icon card__icon--white">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 4 5v6c0 5.2 3.4 9 8 11 4.6-2 8-5.8 8-11V5l-8-3Z" stroke="currentColor" stroke-width="1.6"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <h3 class="card__title">الوقاية من الأمراض</h3>
          <p class="card__desc">
            أثبتت الدراسات أن الالتزام بجدول التطعيمات يقلل من احتمالية الإصابة بالأمراض المزمنة
            بنسبة تصل إلى 95%.
          </p>
        </article>

        <!-- تاريخ صحي رقمي -->
        <article class="card card--white">
          <span class="card__icon card__icon--dark">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M3 5v5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <h3 class="card__title">تاريخ صحي رقمي</h3>
          <p class="card__desc">
            احتفظ بسجل كامل لجميع تطعيمات أطفالك في مكان واحد، سهّل الوصول والمشاركة مع الأطباء عند
            الحاجة.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.why {
  padding: 90px 0;
}

.why__head {
  text-align: center;
  margin-bottom: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.why__grid {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  grid-template-rows: auto auto;
  gap: 24px;
}

.card {
  border-radius: var(--radius-lg);
  padding: 36px;
  position: relative;
  overflow: hidden;
}

.card--light {
  background: var(--color-gray-100);
  grid-column: 1;
  grid-row: 1;
}

.card--teal {
  background: linear-gradient(135deg, var(--color-teal-800), var(--color-teal-900));
  color: var(--color-white);
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card--green {
  background: var(--color-green-100);
  grid-column: 1;
  grid-row: 2;
}

.card--white {
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
  grid-column: 2;
  grid-row: 2;
}

.card__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.card__icon--dark {
  background: var(--color-white);
  color: var(--color-teal-800);
  box-shadow: var(--shadow-sm);
}

.card__icon--white {
  background: rgba(255, 255, 255, 0.6);
  color: var(--color-teal-800);
}

.card__title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
}

.card__title--white {
  color: var(--color-white);
  font-size: 24px;
}

.card__desc {
  font-size: 14.5px;
  color: var(--color-text-muted);
  line-height: 1.8;
  max-width: 440px;
}

.card__desc--light {
  color: rgba(255, 255, 255, 0.82);
}

.card__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  background: var(--color-white);
  color: var(--color-teal-800);
  font-weight: 700;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 999px;
  width: fit-content;
}

.card__dots {
  position: absolute;
  bottom: 28px;
  left: 32px;
  display: flex;
  gap: 8px;
}

.card__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

.card__dots span:first-child {
  width: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
}

@media (max-width: 900px) {
  .why__grid {
    grid-template-columns: 1fr;
  }

  .card--light,
  .card--teal,
  .card--green,
  .card--white {
    grid-column: 1;
  }

  .card--light { grid-row: 1; }
  .card--teal { grid-row: 2; }
  .card--green { grid-row: 3; }
  .card--white { grid-row: 4; }
}
</style>
