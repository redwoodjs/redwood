import path from 'path'

import { loadAndValidateSdls } from '../validateSchema'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const FIXTURE_ERROR_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-errors'
)

const FIXTURE_REQUIRE_AUTH_ROLE_ERROR_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-require-auth-role-errors'
)

describe('Valid SDL with directives', () => {
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
})

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

describe('SDL has directives, but invalid roles', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_REQUIRE_AUTH_ROLE_ERROR_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  test('Invalid due to roles not being a string or array of strings', async () => {
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
