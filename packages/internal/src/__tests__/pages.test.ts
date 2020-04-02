import MockProject, { DEFAULT_PROJECT_PATH } from '@redwoodjs/test-mocks'

import { processPagesDir } from '../pages'

describe('pages', () => {
  const mockrw = new MockProject()

  beforeEach(() => {
    mockrw.mock()
  })

  afterAll(() => {
    mockrw.restore()
  })

  describe('processPagesDir', () => {
    it('finds the pages and returns the correct things', () => {
      mockrw.mergePaths(() => ({
        web: {
          src: {
            pages: {
              HomePage: { 'HomePage.js': '' },
              AboutPage: { 'AboutPage.js': '' },
              Admin: { UsersPage: { 'UsersPage.js': '' } },
            },
          },
        },
      }))

      const pages = processPagesDir(`${DEFAULT_PROJECT_PATH}/web/src/pages`)

      mockrw.restore()
      expect(pages).toMatchSnapshot()
    })
  })
})
