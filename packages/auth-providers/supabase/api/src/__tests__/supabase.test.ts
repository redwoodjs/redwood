import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { vi, beforeAll, afterAll, test, expect } from 'vitest'

import { authDecoder } from '../decoder'

vi.mock('jsonwebtoken', () => {
  return {
    default: {
      verify: vi.fn(() => {
        return {
          sub: 'abc123',
        }
      }),
      decode: vi.fn(),
    },
  }
})

const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}

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
