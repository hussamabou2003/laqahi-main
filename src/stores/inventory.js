import { defineStore } from 'pinia'
import { getInventoryApi, addInventoryApi, updateInventoryApi } from '../utils/api'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  getters: {
    list: (state) => state.items,
    lowStockItems: (state) => state.items.filter(i => i.is_low_stock || i.quantity <= (i.min_threshold || 10))
  },
  actions: {
    async fetchInventory(centerId) {
      this.loading = true
      this.error = null
      try {
        const data = await getInventoryApi(centerId)
        this.items = data || []
        return this.items
      } catch (err) {
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    async addStock(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await addInventoryApi(payload)
        await this.fetchInventory(payload.center_id)
        return res
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateStock(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await updateInventoryApi(id, payload)
        await this.fetchInventory(payload?.center_id)
        return res
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
