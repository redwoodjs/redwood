import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodSide } from '../side'

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

    it('returns the correct sides', () => {
      const sides = RedwoodSide.parseSides()
      expect(sides.length).toMatchSnapshot('sides count')
      for (let i = 0; i < sides.length; i++) {
        const side = sides[i]
        side.filepath = stripAndFormatPathForTesting(
          side.filepath,
          PROJECT_PATH
        )
        expect(side).toMatchSnapshot(`${side.filepath} content`)
        expect(side.getErrors()).toMatchSnapshot(`${side.filepath} errors`)
        expect(side.getWarnings()).toMatchSnapshot(`${side.filepath} warnings`)
      }
    })
  }
)
