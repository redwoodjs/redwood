import jwt from 'jsonwebtoken'

import { req } from '../../__tests__/fixtures/helpers'
import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn(),
    decode: jest.fn(),
  }
})

let consoleError

beforeAll(() => {
  consoleError = console.error
  console.error = () => {}
})

afterAll(() => {
  console.error = consoleError
})

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'clerk', req)

  expect(decoded).toBe(null)
})

test('throws if SUPERTOKENS_JWKS_URL env var is not set', async () => {
  delete process.env.SUPERTOKENS_JWKS_URL

  await expect(authDecoder('token', 'supertokens', req)).rejects.toThrow(
    'SUPERTOKENS_JWKS_URL env var is not set'
  )
})

test('uses verify', () => {
  process.env.SUPERTOKENS_JWKS_URL = 'jwks-url'

  authDecoder('token', 'supertokens', req)

  expect(jwt.verify).toHaveBeenCalled()
})
