import path from 'path'

import { loadAndValidateSdls } from '../validateSchema'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Validates correctly on all platforms', async () => {
  let isSdlValid

  try {
    await loadAndValidateSdls()
    isSdlValid = true
  } catch (e) {
    isSdlValid = false
  }

  expect(isSdlValid).toBe(true)
})
