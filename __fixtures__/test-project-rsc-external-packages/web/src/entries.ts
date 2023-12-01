import { defineEntries } from '@redwoodjs/vite/entries'

export default defineEntries(
  // getEntry
  async (id) => {
    switch (id) {
      case 'AboutPage':
        return import('./AboutPage')
      case 'HomePage':
        return import('./HomePage')
      default:
        return null
    }
  }
)
