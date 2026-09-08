import { defineStore } from 'pinia'
import { getDoctorsApi, createDoctorApi, updateDoctorApi, deleteDoctorApi } from '../utils/api'

export const useDoctorsStore = defineStore('doctors', {
  state: () => ({
    staff: [],
    loading: false,
    error: null
  }),
  getters: {
    list: (state) => state.staff,
    total: (state) => state.staff.length,
    pendingCount: () => 0,
    urgentPendingCount: () => 0,
    newThisMonth: () => 1,
    byId: (state) => (id) => state.staff.find(d => String(d.id) === String(id))
  },
  actions: {
    async fetchDoctors(centerId) {
      this.loading = true
      this.error = null
      try {
        const data = await getDoctorsApi(centerId)
        this.staff = (data || []).map(d => ({
          ...d,
          name: d.name || d.fullName,
          center: d.center?.name || d.centerName || 'المركز الصحّي',
          role: 'doctor',
          color: '#3b82f6',
          initials: (d.name || '').startsWith('د.') ? (d.name || '').slice(0, 4) : (d.name || '').slice(0, 2)
        }))
        return this.staff
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async add(doctorData) {
      try {
        const res = await createDoctorApi(doctorData)
        await this.fetchDoctors()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async update(id, updatedData) {
      try {
        const res = await updateDoctorApi(id, updatedData)
        await this.fetchDoctors()
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async remove(id) {
      try {
        await deleteDoctorApi(id)
        this.staff = this.staff.filter(d => String(d.id) !== String(id))
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})