import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { vi, beforeAll, afterAll, test, expect } from 'vitest'

import { authDecoder, messageForSupabaseSettingsError } from '../decoder'

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_KEY = 'fake-key'
  process.env.SUPABASE_JWT_SECRET = 'fake-jwt-secret'
})

afterAll(() => {
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_KEY
  delete process.env.SUPABASE_JWT_SECRET
})

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

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn(() => {
      return {
        auth: {
          getSession: vi.fn(() => {
            return {
              data: {
                session: {
                  access_token: 'access-token',
                },
              },
            }
          }),
        },
      }
    }),
  }
})

const req = {
  event: { headers: {} } as APIGatewayProxyEvent,
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
  const errorMessage = messageForSupabaseSettingsError('SUPABASE_JWT_SECRET')

  await expect(authDecoder('token', 'supabase', req)).rejects.toThrow(
    errorMessage,
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
