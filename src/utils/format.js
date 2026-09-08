/**
 * أدوات تنسيق مشتركة لعرض الأرقام المحسوبة من المتاجر (stores) بشكل بشري مقروء.
 * لا تحتوي أي بيانات — فقط تنسيق لأرقام حقيقية قادمة من الحالة (state).
 */

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n ?? 0)
}

/** يحوّل 12500 إلى "12.5k" وما دون 1000 يبقى كما هو */
export function formatCompact(n) {
  const value = n ?? 0
  if (value >= 1000) {
    const k = value / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return String(value)
}

export function formatPercent(n) {
  return `${Math.round(n ?? 0)}%`
}

/**
 * يحسب نسبة التغيّر الحقيقية بين فترتين فعليتين (وليس رقمًا وهميًا).
 * إن لم تتوفر بيانات فترة سابقة (previous = 0)، لا معنى لنسبة مئوية فنُعيد "جديد".
 */
export function computeTrend(current, previous) {
  if (!previous) {
    return { text: current > 0 ? 'جديد' : 'لا بيانات بعد', type: 'neutral' }
  }
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  if (pct === 0) return { text: 'مستقر', type: 'neutral' }
  const sign = pct > 0 ? '+' : ''
  return { text: `${sign}${pct}% مقارنة بالأسبوع الماضي`, type: pct > 0 ? 'up' : 'down' }
}
