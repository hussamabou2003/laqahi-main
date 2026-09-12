import { defineStore } from 'pinia'
import { getSharedCentersApi, getAdminCentersApi, createCenterApi, updateCenterApi, deleteCenterApi } from '../utils/api'

export const useCentersStore = defineStore('centers', {
  state: () => ({
    list: [],
    loading: false,
    error: null
  }),
  
  getters: {
    // إحصائيات لوحة الإدارة والطبيب
    total: (state) => state.list.length,
    activeCount: (state) => state.list.filter(c => c.status === 'نشط').length,
    activeCentersCount: (state) => state.list.filter(c => c.status === 'نشط').length,
    inactiveCount: (state) => state.list.filter(c => c.status !== 'نشط').length,
    
    // استخراج عدد المناطق الفريدة
    regionsCount: (state) => {
      const regions = state.list.map(c => c.region || (c.address ? c.address.split('-')[0].trim() : c.name))
      return new Set(regions).size
    },
    
    // إجمالي السعة الاستيعابية لجميع المراكز
    totalDailyCapacity: (state) => state.list.reduce((sum, c) => sum + (c.capacityPerDay || 150), 0)
  },
  
  actions: {
    async fetchCenters(isAdmin = false) {
      this.loading = true
      this.error = null
      try {
        const data = isAdmin ? await getAdminCentersApi() : await getSharedCentersApi()
        this.list = (data || []).map(c => ({
          ...c,
          location: c.address || c.location || c.name,
          capacityPerDay: c.capacityPerDay || 150,
          status: c.status || 'نشط'
        }))
        return this.list
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async add(centerData) {
      try {
        const res = await createCenterApi(centerData)
        await this.fetchCenters(true)
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async update(id, updatedData) {
      try {
        const res = await updateCenterApi(id, updatedData)
        await this.fetchCenters(true)
        return res
      } catch (err) {
        this.error = err.message
        throw err
      }
    },

    async remove(id) {
      try {
        await deleteCenterApi(id)
        this.list = this.list.filter(c => c.id !== id)
      } catch (err) {
        this.error = err.message
        throw err
      }
    }
  }
})