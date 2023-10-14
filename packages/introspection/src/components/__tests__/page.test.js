import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodPage } from '../page'

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__'
)
const FIXTURE_PROJECTS = [
  'empty-project',
  'example-todo-main',
  'example-todo-main-with-errors',
  'test-project',
]

describe.each(FIXTURE_PROJECTS)(
  "From within the '%s' fixture",
  (PROJECT_NAME) => {
    // Setup RWJS_CWD to point to the fixture project
    const PROJECT_PATH = path.join(FIXTURE_PATH, PROJECT_NAME)
    const RWJS_CWD = process.env.RWJS_CWD
    beforeAll(() => {
      process.env.RWJS_CWD = PROJECT_PATH
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('returns the correct pages', () => {
      const pages = RedwoodPage.parsePages()
      expect(pages.length).toMatchSnapshot('pages count')
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        page.filepath = stripAndFormatPathForTesting(
          page.filepath,
          PROJECT_PATH
        )
        expect(page).toMatchSnapshot(`${page.filepath} content`)
        expect(page.getErrors()).toMatchSnapshot(`${page.filepath} errors`)
        expect(page.getWarnings()).toMatchSnapshot(`${page.filepath} warnings`)
      }
    })
  }
)
