import { defineEntries } from '@redwoodjs/vite/entries'

export default defineEntries(
  // getEntry
  async (id) => {
    switch (id) {
      case 'App':
        return import('./App')
      default:
        return null
    }
  }
)
