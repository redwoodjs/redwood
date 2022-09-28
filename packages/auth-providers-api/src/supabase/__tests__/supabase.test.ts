import jwt from 'jsonwebtoken'

import { req } from '../../__tests__/fixtures/helpers'
import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn(() => {
      return {
        sub: 'abc123',
      }
    }),
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

test('throws if SUPABASE_JWT_SECRET env var is not set', async () => {
  delete process.env.SUPABASE_JWT_SECRET

  await expect(authDecoder('token', 'supabase', req)).rejects.toThrow(
    'SUPABASE_JWT_SECRET env var is not set'
  )
})

test('verifies the token with secret from env', () => {
  process.env.SUPABASE_JWT_SECRET = 'jwt-secret'

  authDecoder('token', 'supabase', req)

  expect(jwt.verify).toHaveBeenCalledWith('token', 'jwt-secret')
})

test('returns verified data', async () => {
  process.env.SUPABASE_JWT_SECRET = 'jwt-secret'

  const decoded = await authDecoder('token', 'supabase', req)

  expect(decoded?.sub).toEqual('abc123')
})
