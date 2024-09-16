import { describe, expect, it, vi, afterEach } from 'vitest'

import { setupEnv } from '../setupEnv'

vi.mock('@redwoodjs/cli-helpers/loadEnvFiles', () => {
  return {
    loadEnvFiles: () => {},
  }
})

const ORIGNAL_NODE_ENV = process.env.NODE_ENV

describe('setupEnv', () => {
  afterEach(() => {
    process.env.NODE_ENV = ORIGNAL_NODE_ENV
  })

  it('if not called, NODE_ENV is not overridden in any way', () => {
    expect(process.env.NODE_ENV).toEqual(ORIGNAL_NODE_ENV)
  })

  it.skip('sets NODE_ENV to development if it starts undefined', () => {
    process.env.NODE_ENV = undefined

    setupEnv()

    expect(process.env.NODE_ENV).toEqual('development')
  })
})
