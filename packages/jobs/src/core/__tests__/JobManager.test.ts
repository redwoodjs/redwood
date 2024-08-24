import { describe, expect, vi, it, beforeEach } from 'vitest'

import type { Job, JobDefinition } from '../../types.js'
import { JobManager } from '../JobManager.js'
import { Scheduler } from '../Scheduler.js'

import { MockAdapter, mockLogger } from './mocks.js'

vi.mock('../Scheduler')

describe('constructor', () => {
  const mockAdapter = new MockAdapter()
  const adapters = { mock: mockAdapter }
  const queues = ['queue'] as const
  const logger = mockLogger
  const workers = [
    {
      adapter: 'mock' as const,
      queue: '*' as const,
      count: 1,
    },
  ]

  let manager: JobManager<typeof adapters, typeof queues, typeof logger>

  beforeEach(() => {
    manager = new JobManager({
      adapters,
      queues,
      logger,
      workers,
    })
  })

  it('saves adapters', () => {
    expect(manager.adapters).toEqual({ mock: mockAdapter })
  })

  it('saves queues', () => {
    expect(manager.queues).toEqual(queues)
  })

  it('saves logger', () => {
    expect(manager.logger).toEqual(logger)
  })

  it('saves workers', () => {
    expect(manager.workers).toEqual(workers)
  })
})

describe('createScheduler()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const mockAdapter = new MockAdapter()

  it('returns a function', () => {
    const manager = new JobManager({
      adapters: {
        mock: mockAdapter,
      },
      queues: ['default'] as const,
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
      queues: ['*'] as const,
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
      queues: ['default'] as const,
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
      queues: ['default'] as const,
      logger: mockLogger,
      workers: [],
    })
    const mockJob: Job<['default'], unknown[]> = {
      queue: 'default',
      name: 'mockJob',
      path: 'mockJob/mockJob',

      perform: vi.fn(),
    }
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
      queues: ['default'] as const,
      logger: mockLogger,
      workers: [],
    })
    const jobDefinition: JobDefinition<['default'], unknown[]> = {
      queue: 'default',
      perform: vi.fn(),
    }

    const job = manager.createJob(jobDefinition)

    expect(job).toEqual(jobDefinition)
  })
})
