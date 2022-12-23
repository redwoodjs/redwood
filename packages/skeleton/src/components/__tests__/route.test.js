import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
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

  const project = RedwoodProject.getProject({
    pathWithinProject: PROJECT_PATH,
    insertIntoCache: false,
    readFromCache: false,
  })
  const routers = project
    .getRouters()
    .sort((a, b) =>
      a.filepath > b.filepath ? 1 : b.filepath > a.filepath ? -1 : 0
    )

  describe.each(routers)('router $#', (router) => {
    const routes = router.routes
    routes.forEach((route) => {
      route.executeAdditionalChecks()
    })
    test('routes return the correct pages', () => {
      const routePageMap = new Map()
      routes.forEach((route) => {
        routePageMap.set(route, route.getPage())
      })
      routePageMap.forEach((value, key) => {
        key.filepath = stripAndFormatPathForTesting(key.filepath, PROJECT_PATH)
        if (value !== undefined) {
          value.filepath = stripAndFormatPathForTesting(
            value.filepath,
            PROJECT_PATH
          )
        }
      })
      expect(routePageMap).toMatchSnapshot()
    })
  })
})
