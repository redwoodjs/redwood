import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { extractPages } from '../page'
import { RedwoodProject } from '../project'

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '__fixtures__'
)

describe.each([
  'empty-project',
  'example-todo-main',
  'example-todo-main-with-errors',
  'test-project',
])('From within the %s fixture', (PROJECT_NAME) => {
  const PROJECT_PATH = path.join(FIXTURE_PATH, PROJECT_NAME)

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = PROJECT_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  it('returns the correct pages without a project', () => {
    const pages = extractPages(undefined)
    pages.forEach((page) => {
      page.executeAdditionalChecks()
      page.filepath = stripAndFormatPathForTesting(page.filepath, PROJECT_PATH)
      expect(page).toMatchSnapshot(page.filepath)
    })
    expect(pages.length).toMatchSnapshot('page count')
  })

  it('returns the correct pages with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const pages = extractPages(project)
    pages.forEach((page) => {
      page.executeAdditionalChecks()
      page.filepath = stripAndFormatPathForTesting(page.filepath, PROJECT_PATH)
      expect(page).toMatchSnapshot(page.filepath)
    })
    expect(pages.length).toMatchSnapshot('page count')
  })
})
