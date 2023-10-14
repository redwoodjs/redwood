import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodRouter } from '../router'

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

    it('returns the correct router', () => {
      const router = RedwoodRouter.parseRouter()
      router.filepath = stripAndFormatPathForTesting(
        router.filepath,
        PROJECT_PATH
      )
      for (let i = 0; i < router.routes.length; i++) {
        const route = router.routes[i]
        route.filepath = stripAndFormatPathForTesting(
          route.filepath,
          PROJECT_PATH
        )
      }

      expect(router).toMatchSnapshot('router content')
      expect(router.getErrors()).toMatchSnapshot(`${router.filepath} errors`)
      expect(router.getWarnings()).toMatchSnapshot(
        `${router.filepath} warnings`
      )
    })
  }
)
