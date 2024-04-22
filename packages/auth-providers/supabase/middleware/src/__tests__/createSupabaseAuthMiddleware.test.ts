import path from 'node:path'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
// import { MiddlewareRequest as MWRequest } from '@redwoodjs/vite/middleware'

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
})
