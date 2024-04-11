import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

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
    }

    const res = await middleware(req)

    expect(res).toBeDefined()
    expect(res).toHaveProperty('body', undefined)
    expect(res).toHaveProperty('status', 200)
  })
})
