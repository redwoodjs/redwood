import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareRequest as MWRequest } from '@redwoodjs/vite/middleware'

import { createDbAuthMiddleware } from '../index'
import type { DbAuthMiddlewareOptions } from '../index'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../../../__fixtures__/example-todo-main',
)
// const SESSION_SECRET = '540d03ebb00b441f8f7442cbc39958ad'

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
          multiValueHeaders: {},
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
  it('handles a login request', async () => {
    const user = { id: 2, email: 'user-login@example.com' }
    const request = new Request(
      'http://localhost:8911/middleware/dbauth/login',
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
      dbAuthHandler: async () => {
        return {
          body: JSON.stringify(user),
          headers: {
            Cookie:
              'session=cookie-value; Path=/; HttpOnly; SameSite=Lax; Secure',
          },
          statusCode: 200,
        }
      },
    }
    const middleware = createDbAuthMiddleware(options)

    const res = await middleware(req)

    expect(res).toBeDefined()
    expect(res).toHaveProperty('body', JSON.stringify(user))
    expect(res).toHaveProperty('status', 200)
  })
  it('handles a logout request', async () => {})
  it('handles a signup request', async () => {
    const user = {
      id: 2,
      email: 'user-signup@example.com',
      name: 'user-signup',
    }
    const request = new Request(
      'http://localhost:8911/middleware/dbauth/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          username: user.email,
          name: user.name,
          password: 'password',
        }),
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
            id: user.id,
            email: user.email,
            name: user.name,
          }),
          headers: {
            ['set-cookie']:
              'session=cookie-value; Path=/; HttpOnly; SameSite=Lax; Secure',
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
      JSON.stringify({ id: user.id, email: user.email, name: user.name }),
    )

    expect(res).toHaveProperty('status', 200)
    // expect(res).toHaveProperty('cookies', [
    //   'session=cookie-value; Path=/; HttpOnly; SameSite=Lax; Secure',
    // ])
  })
  it('handles a currentUser request', async () => {})
  it('handles a POST that is not one of the above', async () => {})
  it('handles a GET request with correct cookies', async () => {})
  it('handles a GET request with no cookies', async () => {})
  it('handles a GET request with incorrect cookies (bad decrypt)', async () => {})
  it('handles a GET request with no cookies and currentUser', async () => {})
  it('handles a GET request with expired cookies', async () => {})
})
