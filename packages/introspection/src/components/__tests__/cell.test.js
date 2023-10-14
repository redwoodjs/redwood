import path from 'node:path'

import { stripAndFormatPathForTesting } from '../../lib/testing'
import { RedwoodCell } from '../cell'

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

    it('returns the correct cells', () => {
      const cells = RedwoodCell.parseCells()
      expect(cells.length).toMatchSnapshot('cells count')
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        cell.filepath = stripAndFormatPathForTesting(
          cell.filepath,
          PROJECT_PATH
        )
        expect(cell).toMatchSnapshot(`${cell.filepath} content`)
        expect(cell.getErrors()).toMatchSnapshot(`${cell.filepath} errors`)
        expect(cell.getWarnings()).toMatchSnapshot(`${cell.filepath} warnings`)
      }
    })
  }
)
