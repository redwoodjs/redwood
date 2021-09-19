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
  // expect.assertions(1)

  // let didNotError
  // try {
  //   await loadAndValidateSdls()
  //   didNotError = true
  // } catch (e) {
  //   didNotError = false
  // } finally {
  //   expect(didNotError).toBe(true)
  // }

  let isSdlValid
  try {
    isSdlValid = await loadAndValidateSdls()
  } catch (e) {
    isSdlValid = false
  }

  expect(isSdlValid).toBe(true)
})
