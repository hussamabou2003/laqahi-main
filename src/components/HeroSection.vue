<script setup>
import familyImg from '../assets/familyy.png'

const features = [
  {
    label: 'تقارير طبية',
    icon: 'report'
  },
  {
    label: 'أقرب المراكز',
    icon: 'pin'
  },
  {
    label: 'تنبيهات ذكية',
    icon: 'bell'
  },
  {
    label: 'آمن ومعتمد',
    icon: 'shield'
  }
]
</script>

<template>
  <section class="hero" id="home">
    <div class="container hero__inner">
      <!-- المحتوى النصي -->
      <div class="hero__content">
        <span class="eyebrow">مستقبل آمن لأطفالنا</span>
        <h1 class="hero__title">
          احمِ مستقبلهم <br />
          بكل <span class="hero__title--accent">لقاح</span>
        </h1>
        <p class="hero__desc">
          نظام "لقاحي" هو منصة وطنية متكاملة مخصصة لمتابعة تطعيمات الأطفال وإدارة جداول التحصين
          بذكاء وسهولة، لضمان مجتمع صحي وآمن.
        </p>

        <div class="hero__cta">
          <router-link :to="{ name: 'signup' }" class="btn btn-primary">  ابدأ الآن 
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right: 6px;">
            <path d="M10 19l-7-7m0 0 7-7m-7 7h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>
          </router-link>
          <a href="#more" class="btn btn-outline">تعرف أكثر</a>
        </div>

        <ul class="hero__features">
          <li v-for="f in features" :key="f.label" class="feature">
            <span class="feature__icon">
              <svg v-if="f.icon === 'report'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/>
                <path d="M8 13v4M12 9v8M16 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="f.icon === 'pin'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z" stroke="currentColor" stroke-width="1.6"/>
                <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/>
              </svg>
              <svg v-else-if="f.icon === 'bell'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="feature__label">{{ f.label }}</span>
          </li>
        </ul>
      </div>

      <!-- الرسمة التوضيحية -->
      <div class="hero__art">
        <div class="art__deco art__deco--1">+</div>
        <div class="art__deco art__deco--2">+</div>

        <div class="art__circle">
          <!-- picture -->
          <img :src="familyImg" alt="صورة العائلة" class="family-illustration" />
        </div>

        <!-- بطاقة التحصين العائمة -->
        <div class="art__badge">
          <span class="art__badge-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22b06a" />
              <path d="M8 12.5 10.5 15 16 9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div>
            <p class="art__badge-title">تم التحصين</p>
            <p class="art__badge-desc">تلقى أكثر من مليون طفل جرعاتهم المجدولة عبر لقاحي بنجاح.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 72px 0 40px;
}

.hero__inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 48px;
}

.hero__title {
  font-size: 52px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--color-text);
  margin-bottom: 22px;
}

.hero__title--accent {
  color: var(--color-teal-800);
}

.hero__desc {
  font-size: 17px;
  color: var(--color-text-muted);
  max-width: 520px;
  margin-bottom: 32px;
}

.hero__cta {
  display: flex;
  gap: 14px;
  margin-bottom: 44px;
}

.hero__features {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  width: 96px;
}

.feature__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-teal-800);
}

.feature__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.hero__art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.art__circle {
  width: 100%;
  max-width: 500px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 0; 
}

.family-illustration {
  width: 100%;
  height: auto;
  max-height: 460px;
  object-fit: contain;
  mix-blend-mode: multiply; 
}

.art__deco {
  position: absolute;
  color: var(--color-green-600);
  font-size: 30px;
  font-weight: 800;
  opacity: 0.7;
}

.art__deco--1 {
  top: 12%;
  left: 8%;
}

.art__deco--2 {
  bottom: 18%;
  left: -2%;
  font-size: 22px;
}

.art__badge {
  position: absolute;
  bottom: 2%;
  right: -2%;
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 250px;
  z-index: 2;
}

.art__badge-title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
}

.art__badge-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

@media (max-width: 960px) {
  .hero__inner {
    grid-template-columns: 1fr;
  }

  .hero__title {
    font-size: 38px;
  }

  .hero__art {
    order: -1;
    min-height: 320px;
  }

  .art__badge {
    right: 0;
    bottom: -5%;
  }

}
</style>
