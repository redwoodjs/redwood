import path from 'path'

import { loadAndValidateSdls } from '../validateSchema'

const FIXTURE_ERROR_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-errors'
)

describe('SDL is missing directives', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_ERROR_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('Is invalid due to missing directives', async () => {
    let isSdlValid

    try {
      await loadAndValidateSdls()
      isSdlValid = true
    } catch (e) {
      isSdlValid = false
    }

    expect(isSdlValid).toBe(false)
  })
})
