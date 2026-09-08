<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  footer: { type: String, default: '' },
  trend: { type: String, default: '' }, // e.g. "+5%" أو "ثابت" أو "مستقر"
  trendType: { type: String, default: 'neutral' }, // up | down | neutral
  tone: { type: String, default: 'white' }, // white | dark
  icon: { type: String, default: '' }, 
  iconBg: { type: String, default: 'var(--color-green-50)' },
  iconColor: { type: String, default: 'var(--color-green-800)' }
})
</script>

<template>
  <div class="stat-card" :class="{ 'stat-card--dark': tone === 'dark' }">
    <div class="stat-card__top">
      <!-- نسبة التغير (Trend) إن وجدت -->
      <span v-if="trend" class="stat-card__trend" :class="`stat-card__trend--${trendType}`">
        <svg v-if="trendType === 'up'" width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M4 17 10 11 14 15 20 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 7h5v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ trend }}
      </span>

      <span class="stat-card__icon" :style="{ background: iconBg, color: iconColor }">
        <slot name="icon">
          <i v-if="icon" :class="icon"></i>
        </slot>
      </span>
    </div>
    
    <!-- القيمة والنص -->
    <p class="stat-card__value">{{ value }}</p>
    <p class="stat-card__label">{{ label }}</p>
    
    <p v-if="footer" class="stat-card__footer">{{ footer }}</p>
  </div>
</template>

<style scoped>

.stat-card {
  background: var(--color-white); 
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 22px;
  box-shadow: var(--shadow-sm);
  flex: 1; 
  min-width: 130px; 
}

.stat-card--dark {
  background: linear-gradient(150deg, var(--color-green-800), var(--color-green-900));
  color: var(--color-white);
  border: none;
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.stat-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-card--dark .stat-card__icon {
  background: rgba(255, 255, 255, 0.15) !important;
  color: var(--color-white) !important;
}

.stat-card__trend {
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
}

.stat-card__trend--up {
  color: var(--color-green-700);
  background: var(--color-green-50);
}

.stat-card__trend--down {
  color: var(--color-danger-600);
  background: var(--color-danger-100);
}

.stat-card__trend--neutral {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}

.stat-card--dark .stat-card__trend--neutral {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.12);
}

.stat-card__value {
  font-size: 30px;
  font-weight: 800;
  margin-bottom: 6px;
}

.stat-card__label {
  font-size: 13.5px;
  color: var(--color-text-muted);
  font-weight: 600;
  margin: 0;
}

.stat-card--dark .stat-card__label {
  color: rgba(255, 255, 255, 0.85);
}

.stat-card__footer {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-card--dark .stat-card__footer {
  color: rgba(255, 255, 255, 0.7);
}
</style>