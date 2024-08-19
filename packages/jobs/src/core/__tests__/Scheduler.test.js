import { describe, expect, vi, it, beforeEach } from 'vitest'

import * as errors from '../../errors'
import { Scheduler } from '../Scheduler'

import { mockAdapter, mockLogger } from './mocks'

vi.useFakeTimers()

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

describe('computeRunAt()', () => {
  it('returns a Date `wait` seconds in the future if `wait` set', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const wait = 10

    expect(scheduler.computeRunAt({ wait })).toEqual(
      new Date(Date.now() + wait * 1000),
    )
  })

  it('returns the `waitUntil` Date, if set', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const waitUntil = new Date(2030, 0, 1, 12, 34, 56)

    expect(scheduler.computeRunAt({ waitUntil })).toEqual(waitUntil)
  })

  it('falls back to now', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })

    expect(scheduler.computeRunAt({ wait: 0 })).toEqual(new Date())
    expect(scheduler.computeRunAt({ waitUntil: null })).toEqual(new Date())
  })
})

describe('buildPayload()', () => {
  it('returns a payload object', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
      priority: 25,
    }
    const args = [{ foo: 'bar' }]
    const options = { priority: 25 }
    const payload = scheduler.buildPayload(job, args, options)

    expect(payload.name).toEqual(job.name)
    expect(payload.path).toEqual(job.path)
    expect(payload.args).toEqual(args)
    expect(payload.runAt).toEqual(new Date())
    expect(payload.queue).toEqual(job.queue)
    expect(payload.priority).toEqual(job.priority)
  })

  it('falls back to a default priority', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
      priority: 25,
    }
    const payload = scheduler.buildPayload(job)

    expect(payload.priority).toEqual(job.priority)
  })

  it('takes into account a `wait` time', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
      priority: 25,
    }
    const options = { wait: 10 }
    const payload = scheduler.buildPayload(job, [], options)

    expect(payload.runAt).toEqual(new Date(Date.now() + options.wait * 1000))
  })

  it('takes into account a `waitUntil` date', () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
      priority: 25,
    }
    const options = { waitUntil: new Date(2030, 0, 1, 12, 34, 56) }
    const payload = scheduler.buildPayload(job, [], options)

    expect(payload.runAt).toEqual(options.waitUntil)
  })

  it('throws an error if no queue set', async () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      priority: 25,
    }

    expect(() => scheduler.buildPayload(job)).toThrow(
      errors.QueueNotDefinedError,
    )
  })
})

describe('schedule()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls the schedule() method on the adapter', async () => {
    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
    }
    const args = [{ foo: 'bar' }]
    const options = {}

    await scheduler.schedule({ job, jobArgs: args, jobOptions: options })

    expect(mockAdapter.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        name: job.name,
        args: args,
      }),
    )
  })

  it('re-throws any error that occurs during scheduling', async () => {
    mockAdapter.schedule.mockImplementationOnce(() => {
      throw new Error('Could not schedule')
    })

    const scheduler = new Scheduler({
      adapter: mockAdapter,
      logger: mockLogger,
    })
    const job = {
      name: 'JobName',
      path: 'JobPath/JobPath',
      queue: 'default',
    }
    const args = [{ foo: 'bar' }]
    const options = {}

    await expect(
      scheduler.schedule({ job, jobArgs: args, jobOptions: options }),
    ).rejects.toThrow(errors.SchedulingError)
  })
})
