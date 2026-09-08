import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] // { id, type, title, message }
  }),
  actions: {
    push(type, title, message = '') {
      const id = nextId++
      this.items.push({ id, type, title, message })
      setTimeout(() => this.dismiss(id), 4500)
      return id
    },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    },
    success(title, message = '') {
      return this.push('success', title, message)
    },
    error(title, message = '') {
      return this.push('error', title, message)
    },
    info(title, message = '') {
      return this.push('info', title, message)
    },
    warning(title, message = '') {
      return this.push('warning', title, message)
    }
  }
})
