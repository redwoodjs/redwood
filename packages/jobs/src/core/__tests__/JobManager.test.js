import { describe, expect, vi, it, beforeEach } from 'vitest'

import { JobManager } from '../JobManager'
import { Scheduler } from '../Scheduler'

import { mockAdapter, mockLogger } from './mocks'

vi.mock('../Scheduler')

describe('constructor', () => {
  let manager, workers

  beforeEach(() => {
    workers = [
      {
        adapter: 'mock',
        queue: '*',
        count: 1,
      },
    ]

    manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: ['queue'],
      logger: mockLogger,
      workers,
    })
  })

  it('saves adapters', () => {
    expect(manager.adapters).toEqual({ mock: mockAdapter })
  })

  it('saves queues', () => {
    expect(manager.queues).toEqual(['queue'])
  })

  it('saves logger', () => {
    expect(manager.logger).toEqual(mockLogger)
  })

  it('saves workers', () => {
    expect(manager.workers).toEqual(workers)
  })
})

describe('createScheduler()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns a function', () => {
    const manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: [],
      logger: mockLogger,
      workers: [],
    })

    const scheduler = manager.createScheduler({ adapter: 'mock' })

    expect(scheduler).toBeInstanceOf(Function)
  })

  it('initializes the scheduler with the correct adapter', () => {
    const manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: ['*'],
      logger: mockLogger,
      workers: [],
    })
    manager.createScheduler({ adapter: 'mock', logger: mockLogger })

    expect(Scheduler).toHaveBeenCalledWith(
      expect.objectContaining({ adapter: mockAdapter }),
    )
  })

  it('initializes the scheduler with a logger', () => {
    const manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: [],
      logger: mockLogger,
      workers: [],
    })
    manager.createScheduler({ adapter: 'mock', logger: mockLogger })

    expect(Scheduler).toHaveBeenCalledWith(
      expect.objectContaining({ logger: mockLogger }),
    )
  })

  it('calling the function invokes the schedule() method of the scheduler', () => {
    const manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: [],
      logger: mockLogger,
      workers: [],
    })
    const mockJob = { perform: () => {} }
    const mockArgs = ['foo']
    const mockOptions = { wait: 300 }
    const scheduler = manager.createScheduler({ adapter: 'mock' })

    scheduler(mockJob, mockArgs, mockOptions)

    expect(Scheduler.prototype.schedule).toHaveBeenCalledWith({
      job: mockJob,
      jobArgs: mockArgs,
      jobOptions: mockOptions,
    })
  })
})

describe('createJob()', () => {
  it('returns the same job description that was passed in', () => {
    const manager = new JobManager({
      adapters: {},
      queues: [],
      logger: mockLogger,
      workers: [],
    })
    const jobDefinition = { perform: () => {} }

    const job = manager.createJob(jobDefinition)

    expect(job).toEqual(jobDefinition)
  })
})
