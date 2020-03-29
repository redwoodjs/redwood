import mockfs from 'mock-fs'

import { processPagesDir } from './pages'

describe('pages', () => {
  describe('processPagesDir', () => {
    // Call `console.log` before mocking the file-system:
    // https://github.com/tschaub/mock-fs/issues/234
    // console.log('')
    mockfs({
      '/path/to/web/src/pages': {
        AboutPage: {
          'AboutPage.js': '',
        },
        Admin: {
          UsersPage: {
            'UsersPage.js': '',
          },
        },
      },
    })

    it('finds the pages and returns the correct things', () => {
      const [AboutPage, AdminUsersPage] = processPagesDir(
        '/path/to/web/src/pages'
      )

      expect(AboutPage).toEqual({
        const: 'AboutPage',
        path: '/path/to/web/src/pages/AboutPage',
        importStatement:
          "const AboutPage = { name: 'AboutPage', loader: () => import('src/pages/AboutPage') }",
      })

      expect(AdminUsersPage).toEqual({
        const: 'AdminUsersPage',
        importStatement:
          "const AdminUsersPage = { name: 'AdminUsersPage', loader: () => import('src/pages/Admin/UsersPage') }",
        path: '/path/to/web/src/pages/Admin/UsersPage',
      })
    })
  })

  afterAll(() => {
    mockfs.restore()
  })
})
