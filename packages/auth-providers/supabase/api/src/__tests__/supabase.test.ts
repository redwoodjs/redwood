import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import {
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  test,
  expect,
} from 'vitest'

import { authDecoder, messageForSupabaseSettingsError } from '../decoder'

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_KEY = 'fake-key'
  process.env.SUPABASE_JWT_SECRET = 'jwt-secret'
})

afterEach(() => {
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

describe('Supabase Decoder', () => {
  test('returns null for unsupported type', async () => {
    const decoded = await authDecoder('token', 'clerk', req)

    expect(decoded).toBe(null)
  })

  describe('with Supabase Bearer token', () => {
    test('throws if SUPABASE_JWT_SECRET env var is not set', async () => {
      delete process.env.SUPABASE_JWT_SECRET
      const errorMessage = messageForSupabaseSettingsError(
        'SUPABASE_JWT_SECRET',
      )

      await expect(authDecoder('token', 'supabase', req)).rejects.toThrow(
        errorMessage,
      )
    })

    test('verifies the token with secret from env', () => {
      authDecoder('token', 'supabase', req)

      expect(jwt.verify).toHaveBeenCalledWith('token', 'jwt-secret')
    })

    test('returns verified data', async () => {
      const decoded = await authDecoder('token', 'supabase', req)

      expect(decoded?.sub).toEqual('abc123')
    })
  })

  describe('with Supabase Cookie', () => {
    describe('make sure all envars are set', () => {
      test('throws if SUPABASE_URL env var is not set', async () => {
        delete process.env.SUPABASE_URL
        const errorMessage = messageForSupabaseSettingsError('SUPABASE_URL')

        const cookieRequest = new Request('http://localhost', {
          headers: new Headers({ cookie: 'auth-provider=supabase' }),
        })

        await expect(
          authDecoder('token', 'supabase', { event: cookieRequest }),
        ).rejects.toThrow(errorMessage)
      })

      test('throws if SUPABASE_KEY env var is not set', async () => {
        delete process.env.SUPABASE_KEY
        const errorMessage = messageForSupabaseSettingsError('SUPABASE_KEY')

        const cookieRequest = new Request('http://localhost', {
          headers: new Headers({ cookie: 'auth-provider=supabase' }),
        })

        await expect(
          authDecoder('token', 'supabase', { event: cookieRequest }),
        ).rejects.toThrow(errorMessage)
      })

      test('throws if SUPABASE_JWT_SECRET env var is not set', async () => {
        delete process.env.SUPABASE_JWT_SECRET
        const errorMessage = messageForSupabaseSettingsError(
          'SUPABASE_JWT_SECRET',
        )

        const cookieRequest = new Request('http://localhost', {
          headers: new Headers({ cookie: 'auth-provider=supabase' }),
        })

        await expect(
          authDecoder('token', 'supabase', { event: cookieRequest }),
        ).rejects.toThrow(errorMessage)
      })
      describe('with valid Session Cookie', async () => {
        test('returns decoded access_token from Cookie', async () => {
          const cookieRequest = new Request('http://localhost', {
            headers: new Headers({
              cookie: 'auth-provider=supabase;sb_access_token=foo',
            }),
          })
          const decoded = await authDecoder('token', 'supabase', {
            event: cookieRequest,
          })

          expect(decoded).toEqual({ sub: 'abc123' })
        })
      })
    })
  })
})
