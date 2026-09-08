import { defineStore } from 'pinia'
import { getVaccinesApi } from '../utils/api'

export const VACCINE_SCHEDULE = [
  {
    stageId: 'birth',
    ageMonths: 0,
    ageText: 'عند الولادة',
    title: 'لقاحات الولادة',
    vaccines: [
      { id: 'bcg', name: 'لقاح السل (BCG)' },
      { id: 'hepb_birth', name: 'التهاب الكبد B (جرعة الولادة)' },
      { id: 'opv0', name: 'شلل الأطفال الفموي (OPV 0)' }
    ]
  },
  {
    stageId: 'm2',
    ageMonths: 2,
    ageText: 'شهران',
    title: 'تطعيمات الشهر الثاني',
    vaccines: [
      { id: 'penta1', name: 'اللقاح الخماسي (Penta 1)' },
      { id: 'ipv1', name: 'شلل الأطفال العضلي (IPV 1)' },
      { id: 'rota1', name: 'لقاح الروتا (Rotavirus 1)' }
    ]
  },
  {
    stageId: 'm4',
    ageMonths: 4,
    ageText: '4 أشهر',
    title: 'تطعيمات الشهر الرابع',
    vaccines: [
      { id: 'penta2', name: 'اللقاح الخماسي (Penta 2)' },
      { id: 'ipv2', name: 'شلل الأطفال العضلي (IPV 2)' },
      { id: 'opv1', name: 'شلل الأطفال الفموي (OPV 1)' },
      { id: 'rota2', name: 'لقاح الروتا (Rotavirus 2)' }
    ]
  },
  {
    stageId: 'm6',
    ageMonths: 6,
    ageText: '6 أشهر',
    title: 'تطعيمات الشهر السادس',
    vaccines: [
      { id: 'penta3', name: 'اللقاح الخماسي (Penta 3)' },
      { id: 'opv2', name: 'شلل الأطفال الفموي (OPV 2)' }
    ]
  },
  {
    stageId: 'm7',
    ageMonths: 7,
    ageText: '7 أشهر',
    title: 'مكمل غذائي',
    vaccines: [
      { id: 'vitA1', name: 'فيتامين أ (Vit A 1)' }
    ]
  },
  {
    stageId: 'm9',
    ageMonths: 9,
    ageText: '9 أشهر',
    title: 'تطعيم الشهر التاسع',
    vaccines: [
      { id: 'measles', name: 'لقاح الحصبة المنفردة' }
    ]
  },
  {
    stageId: 'y1',
    ageMonths: 12,
    ageText: 'سنة',
    title: 'تطعيمات السنة الأولى',
    vaccines: [
      { id: 'mmr1', name: 'الثلاثي الفيروسي (MMR 1)' },
      { id: 'vitA2', name: 'فيتامين أ (Vit A 2)' }
    ]
  },
  {
    stageId: 'y1h',
    ageMonths: 18,
    ageText: 'سنة ونصف',
    title: 'الجرعات الداعمة',
    vaccines: [
      { id: 'dpt_booster', name: 'الثلاثي البكتيري الداعم (DPT Booster)' },
      { id: 'mmr2', name: 'الثلاثي الفيروسي (MMR 2)' },
      { id: 'opv_booster', name: 'شلل الأطفال الفموي الداعم (OPV Booster)' }
    ]
  }
]

// عدد الأيام المسموح تجاوزها بعد موعد الاستحقاق قبل اعتبار المرحلة "متأخرة"
export const GRACE_PERIOD_DAYS = 30

export function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function getPreciseAge(birthDateStr) {
  if (!birthDateStr) return null
  const birth = new Date(birthDateStr)
  const today = new Date()

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
    days += prevMonthLastDay
  }
  if (months < 0) {
    months = 0
    days = 0
  }
  return { months, days }
}

export const useVaccinesStore = defineStore('vaccines', {
  state: () => ({
    list: [],
    loading: false,
    error: null
  }),
  getters: {
    schedule: () => VACCINE_SCHEDULE,
    gracePeriodDays: () => GRACE_PERIOD_DAYS
  },
  actions: {
    async fetchVaccines() {
      this.loading = true
      this.error = null
      try {
        const data = await getVaccinesApi()
        this.list = data || []
        return this.list
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    }
  }
})