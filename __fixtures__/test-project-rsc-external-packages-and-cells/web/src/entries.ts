import { defineEntries } from '@redwoodjs/vite/entries'

export default defineEntries(
  // getEntry
  async (id: string) => {
    switch (id) {
      case 'AboutPage':
        return import('./pages/AboutPage/AboutPage')
      case 'HomePage':
        return import('./pages/HomePage/HomePage')
      case 'UserExampleUserExamplesPage':
        return import('./pages/UserExample/UserExamplesPage/UserExamplesPage')
      case 'UserExampleNewUserExamplePage':
        return import(
          './pages/UserExample/NewUserExamplePage/NewUserExamplePage'
        )
      default:
        return null
    }
  }
)
