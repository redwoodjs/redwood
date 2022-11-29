import path from 'path'

import { getCells } from '../cell'

describe('From inside the test-project fixture', () => {
  const FIXTURE_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '__fixtures__',
    'test-project'
  )

  const RWJS_CWD = process.env.RWJS_CWD
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    process.env.RWJS_CWD = RWJS_CWD
  })

  describe('without project', () => {
    it('returns the correct cells', () => {
      const cells = getCells()
      expect(cells).toBe({})
    })
  })
})
