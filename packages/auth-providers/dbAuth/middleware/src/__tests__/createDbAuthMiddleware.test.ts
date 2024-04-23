import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareRequest as MWRequest } from '@redwoodjs/vite/middleware'

import { createDbAuthMiddleware } from '../index'
import type { DbAuthMiddlewareOptions } from '../index'
const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../../__fixtures__/example-todo-main',
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  delete process.env.RWJS_CWD
})

describe('createDbAuthMiddleware()', () => {
  it('creates middleware for dbAuth cookie auth', async () => {
    const options: DbAuthMiddlewareOptions = {
      cookieName: '8911',
      getCurrentUser: async () => {
        return { id: 1, email: 'user-1@example.com' }
      },
      dbAuthHandler: async () => {
        return {
          body: 'body',
          headers: {},
          statusCode: 200,
        }
      },
    }
    const middleware = createDbAuthMiddleware(options)
    const req = {
      method: 'GET',
      headers: new Headers(),
      url: 'http://localhost:8911',
    } as MiddlewareRequest

    const res = await middleware(req)

    expect(res).toBeDefined()
    expect(res).toHaveProperty('body', undefined)
    expect(res).toHaveProperty('status', 200)
  })
  describe('handle all supported dbAuth verbs (aka methods) and their HTTP methods', async () => {
    /**
     * Supported verbs and their corresponding HTTP methods:
     *
     * login: 'POST',
     * logout: 'POST',
     * resetPassword: 'POST',
     * signup: 'POST',
     * forgotPassword: 'POST',
     * getToken: 'GET',
     * validateResetToken: 'POST',
     * webAuthnRegOptions: 'GET',
     * webAuthnRegister: 'POST',
     * webAuthnAuthOptions: 'GET',
     * webAuthnAuthenticate: 'POST',
     */

    it('handles a login request', async () => {
      const user = { id: 2, email: 'user-login@example.com' }
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=login',
        {
          method: 'POST',
          body: JSON.stringify({ username: user.email, password: 'password' }),
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: vi.fn(async () => {
          return {
            body: JSON.stringify(user),
            headers: {
              Cookie:
                'session=cookie-value; Path=/; HttpOnly; SameSite=Lax; Secure',
            },
            statusCode: 200,
          }
        }),
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)

      // Forwards the request on
      expect(options.dbAuthHandler).toHaveBeenCalledWith(req)

      expect(res).toBeDefined()
      expect(res).toHaveProperty('body', JSON.stringify(user))
      expect(res).toHaveProperty('status', 200)
    })

    it('handles a logout request', async () => {
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=logout',
        {
          method: 'POST',
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: '',
            headers: {
              'set-cookie':
                'session=cookie-value; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax; Secure',
            },
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)

      expect(res).toBeDefined()
      expect(res).toHaveProperty('body', '')
      expect(res).toHaveProperty('status', 200)
      expect(res.headers.getSetCookie()).toContain(
        'session=cookie-value; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax; Secure',
      )
    })

    it('handles a signup request', async () => {
      const user = {
        id: 2,
        email: 'user-signup@example.com',
        name: 'user-signup',
      }
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=signUp',
        {
          method: 'POST',
          body: JSON.stringify({
            username: user.email,
            name: user.name,
            password: 'password',
          }),
          headers: {},
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: JSON.stringify({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
            }),
            headers: {
              'set-cookie': 'session_8911=some-encrypted-cookie',
            },
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)

      expect(res).toBeDefined()
      expect(res).toHaveProperty(
        'body',
        JSON.stringify({
          user: { id: user.id, email: user.email, name: user.name },
        }),
      )

      expect(res).toHaveProperty('status', 200)
      expect(res.headers.getSetCookie()).toContain(
        'session_8911=some-encrypted-cookie',
      )
    })

    it('handles a forgotPassword request', async () => {
      const resetToken = JSON.stringify({ resetToken: 'reset-token' })
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=forgotPassword',
        {
          method: 'POST',
          body: JSON.stringify({ username: 'forgotten@example.com' }),
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: resetToken,
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res.body).toEqual(resetToken)
    })
    it('handles a getToken request', async () => {
      const cookieHeader =
        'session=ko6iXKV11DSjb6kFJ4iwcf1FEqa5wPpbL1sdtKiV51Y=|cQaYkOPG/r3ILxWiFiz90w=='

      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=getToken',
        {
          method: 'GET',
          headers: {
            Cookie: cookieHeader,
          },
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return { user: { id: 100, email: 'tolkienUser@example.com' } }
        },
        dbAuthHandler: async () => {
          return {
            body: '',
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res).toBeDefined()

      const serverAuthContext = req.serverAuthContext.get()
      expect(serverAuthContext.isAuthenticated).toBe(true)
      expect(serverAuthContext.currentUser).toEqual({
        user: { id: 100, email: 'tolkienUser@example.com' },
      })
      expect(serverAuthContext.cookieHeader).toBe(cookieHeader)
    })
    it('handles a validateResetToken request', async () => {
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=validateResetToken',
        {
          method: 'POST',
          body: JSON.stringify({ resetToken: 'some-reset-token' }),
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: JSON.stringify({
              user: { id: 100, email: 'reset@example.com' },
            }),
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res).toBeDefined()
      expect(res.body).toBe(
        JSON.stringify({ user: { id: 100, email: 'reset@example.com' } }),
      )

      const serverAuthContext = req.serverAuthContext.get()
      expect(serverAuthContext.isAuthenticated).toBe(false)
    })
    it('handles a webAuthnRegOptions request', async () => {
      const body = JSON.stringify({
        r: { id: 1 },
        user: { user: { id: 100, email: 'user@example.com' } },
        challenge: 'challenge',
        pubKeyCredParam: '',
        timeout: 100,
        excludeCredentials: false,
      })

      const request = new Request(
        'http://localhost:8911/middleware/dbauth/auth?method=webAuthnRegOptions',
        {
          method: 'GET',
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body,
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res).toBeDefined()
      // should the body be the webAuth reg options?
      // but get requests need a cookie to be set?
      // expect(res.body).toBeDefined()
    })
    // @todo: implement the following tests when try out webAuth
    //   it('handles a webAuthnRegister', async () => {
    //     //: 'POST',
    //   })
    //   it('handles a webAuthnAuthOptions', async () => {
    //     //: 'GET',
    //   })
    //   it('handles a webAuthnAuthenticate', async () => {
    //     //: 'POST',
    //   })
  })
  it('handles a currentUser request', async () => {
    // encrypted session taken fom dbAuth tests
    // I cannot figure out why the header here has to be session
    // but the cookieName session_8911 to work properly
    const cookieHeader =
      'session=ko6iXKV11DSjb6kFJ4iwcf1FEqa5wPpbL1sdtKiV51Y=|cQaYkOPG/r3ILxWiFiz90w=='
    const request = new Request(
      'http://localhost:8911/middleware/dbauth/currentUser',
      {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
      },
    )

    const req = new MWRequest(request)
    const cookie = req.headers.get('Cookie')

    expect(cookie).toBe(cookieHeader)

    const currentUser = { user: { id: 100, email: 'currentUser@example.com' } }

    const options: DbAuthMiddlewareOptions = {
      cookieName: 'session_8911',
      getCurrentUser: async () => {
        return currentUser
      },
      dbAuthHandler: async () => {
        return {
          body: '',
          headers: {},
          statusCode: 200,
        }
      },
    }
    const middleware = createDbAuthMiddleware(options)

    const res = await middleware(req)

    expect(res).toBeDefined()
    expect(res.body).toBe(JSON.stringify({ currentUser }))
  })
  describe('handle exception cases', async () => {
    it('handles a POST that is not one of the supported dbAuth verbs and still build headers when passing along the request', async () => {
      const request = new Request(
        'http://localhost:8911/middleware/dbauth/unsupportedVerb',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {},
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: JSON.stringify({}),
            headers: {
              one: 'header-one',
              two: 'header-two',
            },
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)

      expect(res).toBeDefined()
      expect(res.headers.get('one')).toBe('header-one')
      expect(res.headers.get('two')).toBe('header-two')

      const serverAuthContext = req.serverAuthContext.get()
      expect(serverAuthContext).toHaveProperty('isAuthenticated', false)
    })
    it('handles a GET request with correct cookies', async () => {
      // encrypted session taken fom dbAuth tests
      // I cannot figure out why the header here has to be session
      // but the cookieName session_8911 to work properly
      const cookieHeader =
        'session=ko6iXKV11DSjb6kFJ4iwcf1FEqa5wPpbL1sdtKiV51Y=|cQaYkOPG/r3ILxWiFiz90w=='
      const request = new Request('http://localhost:8911/functions/hello', {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
      })

      const req = new MWRequest(request)
      const cookie = req.headers.get('Cookie')

      expect(cookie).toBe(cookieHeader)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return { user: { id: 100, email: 'hello@example.com' } }
        },
        dbAuthHandler: async () => {
          return {
            body: '',
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      const serverAuthContext = req.serverAuthContext.get()

      expect(res).toBeDefined()
      expect(serverAuthContext.isAuthenticated).toBe(true)
      expect(serverAuthContext.currentUser).toEqual({
        user: { id: 100, email: 'hello@example.com' },
      })
    })
    it('handles a GET request with no cookies', async () => {})
    it('handles a GET request with incorrect cookies (bad decrypt)', async () => {
      const request = new Request(
        'http://localhost:8911/functions/bad-cookie',
        {
          method: 'GET',
          headers: {
            Cookie:
              'session_8911=some-bad-encrypted-cookie;auth-provider=dbAuth',
          },
        },
      )

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: JSON.stringify({}),
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res).toBeDefined()

      const serverAuthContext = req.serverAuthContext.get()
      expect(serverAuthContext).toBeNull()
      expect(res.cookies.entries()).toBe('bazinga')
    })
    it('handles a GET request with no cookies', async () => {
      const request = new Request('http://localhost:8911/functions/no-cookie', {
        method: 'GET',
        headers: {},
      })

      const req = new MWRequest(request)

      const options: DbAuthMiddlewareOptions = {
        cookieName: 'session_8911',
        getCurrentUser: async () => {
          return {}
        },
        dbAuthHandler: async () => {
          return {
            body: JSON.stringify({}),
            headers: {},
            statusCode: 200,
          }
        },
      }
      const middleware = createDbAuthMiddleware(options)

      const res = await middleware(req)
      expect(res).toBeDefined()

      const serverAuthContext = req.serverAuthContext.get()
      expect(serverAuthContext).toHaveProperty('isAuthenticated', false)
    })
  })
})
