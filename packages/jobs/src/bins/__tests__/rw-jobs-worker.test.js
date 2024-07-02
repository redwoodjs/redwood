import path from 'node:path'

import { describe, expect, vi, test } from 'vitest'

// import * as worker from '../worker'

// so that registerApiSideBabelHook() doesn't freak out about redwood.toml
vi.mock('@redwoodjs/babel-config')

describe('worker', () => {
  test('placeholder', () => {
    console.info(process.env.RWJS_CWD)

    expect(true).toBeTruthy()
  })
})
