import path from 'path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodProject } from '../project'
import { extractRouters } from '../router'

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

  it('returns the correct routers without a project', () => {
    const routers = extractRouters(undefined)
    routers.forEach((router) => {
      router.executeAdditionalChecks()
      router.filepath = stripAndFormatPathForTesting(
        router.filepath,
        PROJECT_PATH
      )
      router.routes.forEach((route) => {
        route.executeAdditionalChecks()
        route.filepath = stripAndFormatPathForTesting(
          route.filepath,
          PROJECT_PATH
        )
      })
      router.routes.sort((a, b) =>
        a.filepath > b.filepath ? 1 : b.filepath > a.filepath ? -1 : 0
      )
      expect(router).toMatchSnapshot(router.filepath)
    })
    expect(routers.length).toMatchSnapshot('router count')
  })

  it('returns the correct routers with a project', () => {
    const project = RedwoodProject.getProject({
      pathWithinProject: PROJECT_PATH,
      readFromCache: false,
      insertIntoCache: false,
    })
    const routers = extractRouters(project)
    routers.forEach((router) => {
      router.executeAdditionalChecks()
      router.filepath = stripAndFormatPathForTesting(
        router.filepath,
        PROJECT_PATH
      )
      router.routes.forEach((route) => {
        route.executeAdditionalChecks()
        route.filepath = stripAndFormatPathForTesting(
          route.filepath,
          PROJECT_PATH
        )
      })
      router.routes.sort((a, b) =>
        a.filepath > b.filepath ? 1 : b.filepath > a.filepath ? -1 : 0
      )
      expect(router).toMatchSnapshot(router.filepath)
    })
    expect(routers.length).toMatchSnapshot('router count')
  })
})
