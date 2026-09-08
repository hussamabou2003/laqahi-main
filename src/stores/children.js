import { defineStore } from 'pinia'
import { VACCINE_SCHEDULE } from './vaccines'
import { useNotificationsStore } from './notifications'
import {
  getParentChildrenApi,
  addParentChildApi,
  updateParentChildApi,
  getDoctorChildrenApi,
  getAdminChildrenApi,
  addDoctorChildApi,
  getDoctorChildDetailsApi,
  getParentAppointmentsApi,
  rescheduleAppointmentApi,
  cancelAppointmentApi,
  completeAppointmentApi,
  createDoctorAppointmentApi,
  updateDoctorAppointmentApi,
  confirmAppointmentApi,
  deleteDoctorChildApi
} from '../utils/api'

const todayStr = () => new Date().toISOString().slice(0, 10)

function normalizeChild(c) {
  if (!c) return c
  const stageByAge = {
    0: 'birth',
    60: 'm2',
    120: 'm4',
    180: 'm6',
    210: 'm7',
    270: 'm9',
    365: 'y1',
    545: 'y1h'
  }
  const doses = (c.appointments || c.doses || []).map(a => ({
    id: a.id,
    name: a.vaccine?.name || a.vaccineName || a.name || 'لقاح',
    date: a.appointment_date ? a.appointment_date.slice(0, 10) : (a.date || todayStr()),
    time: a.appointment_date ? a.appointment_date.slice(11, 16) : (a.time || '09:00'),
    status: a.display_status || a.status || 'upcoming',
    notes: a.notes,
    confirmedByParent: !!(a.confirmed_by_parent || a.confirmedByParent),
    place: a.center?.name || a.place,
    stageId: a.stageId || stageByAge[a.vaccine?.recommended_age_days] || 'birth'
  }))
  return {
    ...c,
    id: c.id,
    fullName: c.name || c.fullName,
    birthDate: c.birth_date || c.birthDate,
    gender: c.gender,
    guardianName: c.parent?.name || c.guardianName,
    guardianNationalId: c.parent?.national_id || c.guardianNationalId,
    guardianPhone: c.parent?.phone || c.guardianPhone,
    qrCode: c.qr_code || c.qrCode,
    doses: doses
  }
}

export const useChildrenStore = defineStore('children', {
  state: () => ({
    children: [],
    loading: false,
    error: null
  }),

  getters: {
    getChildById: (state) => (id) => state.children.find(c => String(c.id) === String(id)),
    getChildrenByGuardian: (state) => (nationalId) => state.children.filter(c => c.guardianNationalId === nationalId),

    getAllDosesFlat: (state) => {
      const allDoses = []
      state.children.forEach(child => {
        ;(child.doses || []).forEach(dose => {
          allDoses.push({
            ...dose,
            childId: child.id,
            childName: child.fullName,
            guardianNationalId: child.guardianNationalId
          })
        })
      })
      return allDoses
    },

    getStats: (state) => (childId) => {
      const child = state.children.find(c => String(c.id) === String(childId))
      if (!child || !child.doses) return { overdue: 0, upcoming: 0, completed: 0, total: 0 }

      return {
        overdue: child.doses.filter(d => d.status === 'overdue').length,
        upcoming: child.doses.filter(d => d.status === 'upcoming').length,
        completed: child.doses.filter(d => d.status === 'completed').length,
        total: child.doses.length
      }
    },

    getNextDose: (state) => (childId) => {
      const child = state.children.find(c => String(c.id) === String(childId))
      if (!child || !child.doses) return null

      const pending = child.doses.filter(d => d.status !== 'completed')
      if (!pending.length) return null

      return pending.sort((a, b) => new Date(a.date) - new Date(b.date))[0]
    },

    getChildTimeline: (state) => (childId) => {
      const child = state.children.find(c => String(c.id) === String(childId))
      if (!child) return []

      let currentFound = false;

      return VACCINE_SCHEDULE.map(stage => {
        const dosesForStage = (child.doses || []).filter(d => d.stageId === stage.stageId)

        const isDone = dosesForStage.length > 0 && dosesForStage.every(d => d.status === 'completed')
        const isOverdue = dosesForStage.some(d => d.status === 'overdue')
        const isPending = dosesForStage.some(d => d.status === 'upcoming')

        let status = 'upcoming'

        if (isDone) {
          status = 'done'
        } else if (isOverdue) {
          status = 'overdue'
          currentFound = true
        } else if (isPending) {
          status = 'current'
          currentFound = true
        } else if (!currentFound && !isDone) {
          status = 'current'
          currentFound = true
        }

        return {
          ...stage,
          status,
          isAssumed: false
        }
      })
    },

    totalRegistered: (state) => state.children.length,

    totalVaccinesAdministered: (state) => {
      let count = 0
      state.children.forEach(c => {
        count += (c.doses || []).filter(d => d.status === 'completed').length
      })
      return count
    },

    coverageRate: (state) => {
      let required = 0
      let completed = 0
      state.children.forEach(child => {
        const doses = child.doses || []
        required += doses.length
        completed += doses.filter(d => d.status === 'completed').length
      })
      return required === 0 ? 0 : Math.round((completed / required) * 100)
    },

    averageDailyVaccinations: () => 15,
    registeredThisWeek: () => 0,
    registeredPreviousWeek: () => 0,
    vaccinesThisWeek: () => 0,
    vaccinesPreviousWeek: () => 0,
    dailySeries: () => () => ({ labels: [], values: [] }),
    monthlySeries: () => () => ({ labels: [], values: [] })
  },

  actions: {
    async fetchParentChildren() {
      this.loading = true
      this.error = null
      try {
        const data = await getParentChildrenApi()
        this.children = (data || []).map(normalizeChild)
        return this.children
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchDoctorChildren() {
      this.loading = true
      this.error = null
      try {
        const data = await getDoctorChildrenApi()
        this.children = (data || []).map(normalizeChild)
        return this.children
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchAdminChildren() {
      this.loading = true
      this.error = null
      try {
        const data = await getAdminChildrenApi()
        this.children = (data || []).map(normalizeChild)
        return this.children
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchChildDetails(childId, isDoctor = false) {
      if (isDoctor) {
        try {
          const data = await getDoctorChildDetailsApi(childId)
          const norm = normalizeChild(data)
          const idx = this.children.findIndex(c => String(c.id) === String(childId))
          if (idx !== -1) this.children[idx] = norm
          else this.children.push(norm)
          return norm
        } catch (err) {
          this.error = err.message
        }
      }
    },

    async deleteChild(childId) {
      try {
        await deleteDoctorChildApi(childId)
        this.children = this.children.filter(c => String(c.id) !== String(childId))
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async addChild(childData, isDoctor = false) {
      try {
        if (isDoctor) {
          const res = await addDoctorChildApi(childData)
          await this.fetchDoctorChildren()
          return res
        } else {
          const res = await addParentChildApi(childData)
          await this.fetchParentChildren()
          return res
        }
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async changeChildCenter(childId, centerId) {
      try {
        const res = await updateParentChildApi(childId, { center_id: centerId })
        await this.fetchParentChildren()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async confirmParentAttendance(childId, doseId) {
      try {
        const res = await confirmAppointmentApi(doseId)
        await this.fetchParentChildren()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async confirmAttendance(childId, doseId, notes = '') {
      try {
        const res = await completeAppointmentApi(doseId, { notes })
        await this.fetchDoctorChildren()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async addDoseToChild(childId, dose) {
      const res = await createDoctorAppointmentApi({
        child_id: Number(childId),
        vaccine_id: Number(dose.vaccineId),
        appointment_date: `${dose.date} ${dose.time || '09:00'}:00`,
        status: dose.status === 'completed' ? 'completed' : 'booked',
        notes: dose.notes || null
      })
      await this.fetchDoctorChildren()
      return res
    },

    async updateDose(childId, doseId, dose) {
      const res = await updateDoctorAppointmentApi(doseId, {
        appointment_date: `${dose.date} ${dose.time || '09:00'}:00`,
        status: dose.status === 'completed' ? 'completed' : 'booked',
        notes: dose.notes || null
      })
      await this.fetchDoctorChildren()
      return res
    },

    async rescheduleDose(childId, doseId, newDate) {
      try {
        const res = await rescheduleAppointmentApi(doseId, { appointment_date: newDate })
        await this.fetchParentChildren()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async cancelDose(childId, doseId) {
      try {
        const res = await cancelAppointmentApi(doseId)
        await this.fetchParentChildren()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})
