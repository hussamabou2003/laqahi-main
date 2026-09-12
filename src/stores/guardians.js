import { defineStore } from 'pinia'
import { createParentAccountApi, getAdminParentsApi } from '../utils/api'

export const useGuardiansStore = defineStore('guardians', {
  state: () => ({
    guardians: [],
    loading: false,
    error: null
  }),
  getters: {
    isNationalIdTaken: (state) => (nationalId) =>
      state.guardians.some((guardian) => (guardian.nationalId || guardian.national_id) === nationalId)
  },
  actions: {
    async addGuardian(guardianData) {
      this.loading = true
      this.error = null
      try {
        const payload = {
          name: guardianData.fullName || guardianData.name,
          email: guardianData.email,
          password: guardianData.password,
          national_id: guardianData.nationalId || guardianData.national_id,
          phone: guardianData.phone,
          mother_name: guardianData.motherName || guardianData.mother_name,
          father_name: guardianData.fatherName || guardianData.father_name
        }
        const res = await createParentAccountApi(payload)
        const parentData = res?.data?.parent || res?.parent || res?.data || res
        this.guardians.push(parentData)
        return parentData
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async updateGuardian(guardianId, guardianData) {
      this.loading = true
      this.error = null
      try {
        const payload = {
          name: guardianData.fullName || guardianData.name,
          email: guardianData.email,
          national_id: guardianData.nationalId || guardianData.national_id,
          phone: guardianData.phone
        }
        if (guardianData.password) {
          payload.password = guardianData.password
        }
        // we import updateParentAccountApi dynamically or we must import it at top
        const { updateParentAccountApi } = await import('../utils/api')
        const res = await updateParentAccountApi(guardianId, payload)
        const parentData = res?.data?.parent || res?.parent || res?.data || res
        
        const idx = this.guardians.findIndex(g => g.id === guardianId)
        if (idx !== -1) this.guardians[idx] = parentData
        
        return parentData
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchAdminParents() {
      this.loading = true
      this.error = null
      try {
        this.guardians = (await getAdminParentsApi()) || []
        return this.guardians
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },
    findByNationalId(nationalId) {
      return this.guardians.find((g) => (g.nationalId || g.national_id) === nationalId)
    },
    verifyLogin(nationalId, password) {
      return this.guardians.find((g) => (g.nationalId || g.national_id) === nationalId && g.password === password) || null
    }
  }
})
