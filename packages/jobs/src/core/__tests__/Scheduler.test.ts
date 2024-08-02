import { beforeEach, describe, expect, vi, it } from 'vitest'

import type CliHelpers from '@redwoodjs/cli-helpers'

import {
  DEFAULT_LOGGER,
  DEFAULT_PRIORITY,
  DEFAULT_QUEUE,
  DEFAULT_WAIT,
  DEFAULT_WAIT_UNTIL,
} from '../consts.ts'
import { AdapterNotConfiguredError, SchedulingError } from '../errors.ts'
import { Scheduler } from '../Scheduler.js'

import { mockAdapter, mockLogger } from './mocks.ts'

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal<typeof CliHelpers>()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => true,
  }
})

const FAKE_NOW = new Date('2024-01-01')
vi.useFakeTimers().setSystemTime(FAKE_NOW)

describe('constructor', () => {
  it('throws an error if adapter is not configured', () => {
    expect(() => {
      new Scheduler()
    }).toThrow(AdapterNotConfiguredError)
  })

  it('creates this.config', () => {
    const scheduler = new Scheduler({ config: { adapter: mockAdapter } })

    expect(scheduler.config).toEqual({ adapter: mockAdapter })
  })

  it('creates this.job', () => {
    const job = () => {}
    const scheduler = new Scheduler({ config: { adapter: mockAdapter }, job })

    expect(scheduler.job).toEqual(job)
  })

  it('creates this.jobArgs', () => {
    const jobArgs = ['foo', 123]
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobArgs,
    })

    expect(scheduler.jobArgs).toEqual(jobArgs)
  })

  it('creates this.jobOptions', () => {
    const jobOptions = { wait: 300 }
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions,
    })

    expect(scheduler.jobOptions).toEqual(jobOptions)
  })

  it('creates this.adapter', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.adapter).toEqual(mockAdapter)
  })

  it('creates this.logger', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter, logger: mockLogger },
    })

    expect(scheduler.logger).toEqual(mockLogger)
  })

  it('sets a default logger if none configured', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.logger).toEqual(DEFAULT_LOGGER)
  })
})

describe('get queue()', () => {
  it('returns jobOptions.queue', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { queue: 'foo' },
    })

    expect(scheduler.queue).toEqual('foo')
  })

  it('falls back to config.queue', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter, queue: 'bar' },
    })

    expect(scheduler.queue).toEqual('bar')
  })

  it('falls back to default queue', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.queue).toEqual(DEFAULT_QUEUE)
  })
})

describe('get priority()', () => {
  it('returns jobOptions.priority', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { priority: 1 },
    })

    expect(scheduler.priority).toEqual(1)
  })

  it('falls back to config.priority', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter, priority: 2 },
    })

    expect(scheduler.priority).toEqual(2)
  })

  it('falls back to default priority', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.priority).toEqual(DEFAULT_PRIORITY)
  })
})

describe('get wait()', () => {
  it('returns jobOptions.wait', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { wait: 300 },
    })

    expect(scheduler.wait).toEqual(300)
  })

  it('falls back to config.wait', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter, wait: 200 },
    })

    expect(scheduler.wait).toEqual(200)
  })

  it('falls back to default wait', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.wait).toEqual(DEFAULT_WAIT)
  })
})

describe('get waitUntil()', () => {
  it('returns jobOptions.waitUntil', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { waitUntil: new Date() },
    })

    expect(scheduler.waitUntil).toEqual(expect.any(Date))
  })

  it('falls back to config.waitUntil', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter, waitUntil: new Date() },
    })

    expect(scheduler.waitUntil).toEqual(expect.any(Date))
  })

  it('falls back to default waitUntil', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.waitUntil).toEqual(DEFAULT_WAIT_UNTIL)
  })
})

describe('get runAt()', () => {
  it('returns wait seconds in the future if set', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { wait: 300 },
    })

    expect(scheduler.runAt).toEqual(new Date(FAKE_NOW.getTime() + 300 * 1000))
  })

  it('returns waitUntil date if set', () => {
    const waitUntil = new Date(2025, 0, 1, 12, 0, 0)
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      jobOptions: { waitUntil },
    })

    expect(scheduler.runAt).toEqual(waitUntil)
  })

  it('returns current date if no wait or waitUntil', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
    })

    expect(scheduler.runAt).toEqual(FAKE_NOW)
  })
})

describe('payload()', () => {
  it('returns an object with job, args, runAt, queue, and priority', () => {
    const scheduler = new Scheduler({
      config: { adapter: mockAdapter },
      job: function CustomJob() {},
      jobArgs: ['foo', 123],
      jobOptions: { queue: 'custom', priority: 15 },
    })

    expect(scheduler.payload()).toEqual({
      job: 'CustomJob',
      args: ['foo', 123],
      runAt: FAKE_NOW,
      queue: 'custom',
      priority: 15,
    })
  })
})

describe('schedule()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const scheduler = new Scheduler({
    config: { adapter: mockAdapter, logger: mockLogger },
    job: function CustomJob() {},
    jobArgs: ['foo', 123],
    jobOptions: { queue: 'custom', priority: 15 },
  })

  it('calls adapter.schedule with payload', () => {
    scheduler.schedule()

    expect(mockAdapter.schedule).toHaveBeenCalledWith({
      job: 'CustomJob',
      args: ['foo', 123],
      runAt: FAKE_NOW,
      queue: 'custom',
      priority: 15,
    })
  })

  it('returns true', () => {
    expect(scheduler.schedule()).toEqual(true)
  })

  it('catches and rethrows any errors when scheduling', () => {
    mockAdapter.schedule.mockImplementation(() => {
      throw new Error('Failed to schedule')
    })

    expect(() => {
      scheduler.schedule()
    }).toThrow(SchedulingError)
  })
})
