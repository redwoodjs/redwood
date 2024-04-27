import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import {
  MiddlewareRequest,
  MiddlewareResponse,
} from '@redwoodjs/vite/middleware'

import { createSupabaseAuthMiddleware } from '../index'
import type { SupabaseAuthMiddlewareOptions } from '../index'
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

describe('createSupabaseAuthMiddleware()', () => {
  it('creates middleware for Supabase SSR auth', async () => {
    const options: SupabaseAuthMiddlewareOptions = {
      getCurrentUser: async () => {
        return { id: 1, email: 'user-1@example.com' }
      },
    }
    const middleware = createSupabaseAuthMiddleware(options)
    const request = new Request('http://localhost:8911', {
      method: 'GET',
      headers: new Headers(),
    })
    const req = new MiddlewareRequest(request)
    const res = new MiddlewareResponse()

    const result = await middleware(req, res)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('body', undefined)
    expect(result).toHaveProperty('status', 200)
  })
})
