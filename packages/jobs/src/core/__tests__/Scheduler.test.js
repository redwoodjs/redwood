import { describe, expect, vi, it, beforeEach } from 'vitest'

import { Scheduler } from '../Scheduler'

import { mockAdapter, mockLogger } from './mocks'

describe('constructor', () => {
  it('saves adapter', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })

    expect(scheduler.adapter).toEqual(mockAdapter)
  })

  it('saves logger', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })

    expect(scheduler.logger).toEqual(mockLogger)
  })
})
