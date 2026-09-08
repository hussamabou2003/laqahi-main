<script setup>
const articles = [
  {
    tag: 'تقنية',
    date: '05 مايو 2026',
    title: 'نظام لقاحي يحصل على جائزة الابتكار الرقمي',
    excerpt:
      'تقدير دولي للمنطقة في رقمنة السجلات الصحية وتحسين تجربة أولياء الأمور عبر تقنيات الذكاء الاصطناعي...',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
    link: 'https://elbadilabc-ar.dz/%d8%a7%d9%84%d8%b3%d8%ac%d9%84%d8%a7%d8%aa-%d8%a7%d9%84%d8%b7%d8%a8%d9%8a%d8%a9-%d8%a7%d9%84%d8%b1%d9%82%d9%85%d9%8a%d8%a9/'
    },
  {
    tag: 'إرشادات',
    date: '10 مايو 2026',
    title: 'تحديث جدول تطعيمات الأطفال 2026',
    excerpt:
      'إضافة جرعات تنشيطية جديدة لبعض الفئات العمرية لضمان فعالية المناعة المستدامة طوال العام...',
    image:
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=800&auto=format&fit=crop',
      link: 'https://www.who.int/ar/news-room/questions-and-answers/item/vaccines-and-immunization-what-is-vaccination'
  },
  {
    tag: 'أخبار عامة',
    date: '15 مايو 2026',
    title: 'إطلاق حملة التطعيم الوطنية للمدارس',
    excerpt:
      'وزارة الصحة تعلن عن بدء المرحلة الأولى من تحصين طلاب المدارس الابتدائية ضد الإنفلونزا الموسمية...',
    image:
      'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=800&auto=format&fit=crop',
   link: 'https://www.moh.gov.sy/'
    }
]
</script>

<template>
  <section class="news" id="news">
    <div class="container">
      <div class="news__head">
        <div>
          <h2 class="section-title">أحدث الأخبار والتقارير</h2>
          <p class="section-subtitle">ابق على اطلاع بأحدث التطورات الصحية</p>
        </div>
        <a href="#all-news" class="news__all">
          عرض الكل
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6 9 12l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <div class="news__grid">
        <article v-for="a in articles" :key="a.title" class="news-card">
          <!-- أضفنا وسم a لربط الكارت بالرابط الموجود في البيانات -->
          <a :href="a.link ? a.link : '#'" :target="a.link ? '_blank' : '_self'" class="news-card__link">
            
            <div class="news-card__image">
              <img :src="a.image" :alt="a.title" loading="lazy" />
            </div>

          <div class="news-card__body">
            <div class="news-card__meta">
              <span class="news-card__tag">{{ a.tag }}</span>
              <span class="news-card__date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                {{ a.date }}
              </span>
            </div>
            <h3 class="news-card__title">{{ a.title }}</h3>
            <p class="news-card__excerpt">{{ a.excerpt }}</p>
          </div>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.news {
  padding: 60px 0 100px;
}

.news__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 24px;
}

.news__all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text);
  flex-shrink: 0;
}

.news__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.news-card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.news-card__image {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-gray-100);
}

.news-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-card__body {
  padding: 20px;
}

.news-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 12.5px;
}

.news-card__tag {
  background: var(--color-green-100);
  color: var(--color-teal-800);
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
}

.news-card__date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
}

.news-card__title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 10px;
  line-height: 1.5;
}

.news-card__excerpt {
  font-size: 13.5px;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.news-card__link {
  text-decoration: none;
  color: inherit; 
  display: block; 
  height: 100%;
}

@media (max-width: 960px) {
  .news__grid {
    grid-template-columns: 1fr;
  }

  .news__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
