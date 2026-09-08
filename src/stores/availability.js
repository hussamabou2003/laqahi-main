import { defineStore } from 'pinia'

export const useAvailabilityStore = defineStore('availability', {
  state: () => ({
    slots: JSON.parse(localStorage.getItem('app_availability_slots')) || [] // { id, date, time, isBooked }
  }),
  getters: {
    availableSlots: (state) =>
      [...state.slots]
        .filter((s) => !s.isBooked)
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
  },
  actions: {
    saveToStorage() {
      localStorage.setItem('app_availability_slots', JSON.stringify(this.slots))
    },
    addSlot(date, time) {
      this.slots.push({ id: 'slot-' + Date.now(), date, time, isBooked: false })
      this.saveToStorage()
    },
    bookSlot(slotId) {
      const slot = this.slots.find((s) => s.id === slotId)
      if (slot) {
        slot.isBooked = true
        this.saveToStorage()
      }
    },
    removeSlot(slotId) {
      this.slots = this.slots.filter((s) => s.id !== slotId)
      this.saveToStorage()
    }
  }
})