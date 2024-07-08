import { describe, expect, vi, it } from 'vitest'

import { BaseAdapter } from '../BaseAdapter'

describe('constructor', () => {
  it('saves options', () => {
    const adapter = new BaseAdapter({ foo: 'bar' })

    expect(adapter.options.foo).toEqual('bar')
  })

  it('creates a separate instance var for any logger', () => {
    const mockLogger = vi.fn()
    const adapter = new BaseAdapter({ foo: 'bar', logger: mockLogger })

    expect(adapter.logger).toEqual(mockLogger)
  })
})
