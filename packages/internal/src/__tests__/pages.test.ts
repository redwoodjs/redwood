import mockrw from '@redwoodjs/test-mocks'

import { processPagesDir } from '../pages'

describe('pages', () => {
  beforeEach(() => {
    mockrw.mockProject()
  })

  afterAll(() => {
    mockrw.restore()
  })

  describe('processPagesDir', () => {
    it('finds the pages and returns the correct things', () => {
      const [AboutPage, AdminUsersPage] = processPagesDir(
        '/path/to/project/web/src/pages'
      )

      expect(AboutPage).toEqual({
        const: 'AboutPage',
        path: '/path/to/project/web/src/pages/AboutPage',
        importStatement:
          "const AboutPage = { name: 'AboutPage', loader: () => import('src/pages/AboutPage') }",
      })

      expect(AdminUsersPage).toEqual({
        const: 'AdminUsersPage',
        importStatement:
          "const AdminUsersPage = { name: 'AdminUsersPage', loader: () => import('src/pages/Admin/UsersPage') }",
        path: '/path/to/project/web/src/pages/Admin/UsersPage',
      })
    })
  })
})
