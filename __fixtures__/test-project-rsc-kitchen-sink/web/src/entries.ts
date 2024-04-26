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
      case 'UserExampleUserExamplePage':
        return import('./pages/UserExample/UserExamplePage/UserExamplePage')
      case 'UserExampleNewUserExamplePage':
        return import(
          './pages/UserExample/NewUserExamplePage/NewUserExamplePage'
        )
      case 'EmptyUserEmptyUsersPage':
        return import('./pages/EmptyUser/EmptyUsersPage/EmptyUsersPage')
      case 'EmptyUserNewEmptyUserPage':
        return import('./pages/EmptyUser/NewEmptyUserPage/NewEmptyUserPage')
      case 'MultiCellPage':
        return import('./pages/MultiCellPage/MultiCellPage')
      case 'ServerEntry':
        return import('./entry.server')
      default:
        return null
    }
  }
)
