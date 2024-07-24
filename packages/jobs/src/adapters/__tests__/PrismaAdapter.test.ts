import type { PrismaClient } from '@prisma/client'
import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest'

import type CliHelpers from '@redwoodjs/cli-helpers'

import * as errors from '../../core/errors'
import { PrismaAdapter, DEFAULTS } from '../PrismaAdapter'

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal<typeof CliHelpers>()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => false,
  }
})

let mockDb: PrismaClient

beforeEach(() => {
  mockDb = {
    _activeProvider: 'sqlite',
    _runtimeDataModel: {
      models: {
        BackgroundJob: {
          dbName: null,
        },
      },
    },
    backgroundJob: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  }
})

afterEach(() => {
  vi.resetAllMocks()
})

describe('constructor', () => {
  it('defaults this.model name', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.model).toEqual(DEFAULTS.model)
  })

  it('can manually set this.model', () => {
    mockDb._runtimeDataModel.models = {
      Job: {
        dbName: null,
      },
    }
    mockDb.job = {}

    const adapter = new PrismaAdapter({
      db: mockDb,
      model: 'Job',
    })

    expect(adapter.model).toEqual('Job')
  })

  it('throws an error with a model name that does not exist', () => {
    expect(() => new PrismaAdapter({ db: mockDb, model: 'FooBar' })).toThrow(
      errors.ModelNameError,
    )
  })

  it('sets this.accessor to the correct Prisma accessor', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.accessor).toEqual(mockDb.backgroundJob)
  })

  it('sets this.provider based on the active provider', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.provider).toEqual('sqlite')
  })
})

describe('schedule()', () => {
  it('creates a job in the DB with required data', async () => {
    const createSpy = vi
      .spyOn(mockDb.backgroundJob, 'create')
      .mockReturnValue({ id: 1 })
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })

    expect(createSpy).toHaveBeenCalledWith({
      data: {
        handler: JSON.stringify({
          handler: 'RedwoodJob',
          args: ['foo', 'bar'],
        }),
        priority: 50,
        queue: 'default',
        runAt: new Date(),
      },
    })
  })
})

describe('find()', () => {
  it('returns null if no job found', async () => {
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(null)
    const adapter = new PrismaAdapter({ db: mockDb })
    const job = await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: 'foobar',
    })

    expect(job).toBeNull()
  })

  it('returns a job if found', async () => {
    const mockJob = { id: 1 }
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(mockJob)
    vi.spyOn(mockDb.backgroundJob, 'updateMany').mockReturnValue({ count: 1 })
    const adapter = new PrismaAdapter({ db: mockDb })
    const job = await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: 'default',
    })

    expect(job).toEqual(mockJob)
  })

  it('increments the `attempts` count on the found job', async () => {
    const mockJob = { id: 1, attempts: 0 }
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(mockJob)
    const updateSpy = vi
      .spyOn(mockDb.backgroundJob, 'updateMany')
      .mockReturnValue({ count: 1 })
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: 'default',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempts: 1 }),
      }),
    )
  })

  it('locks the job for the current process', async () => {
    const mockJob = { id: 1, attempts: 0 }
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(mockJob)
    const updateSpy = vi
      .spyOn(mockDb.backgroundJob, 'updateMany')
      .mockReturnValue({ count: 1 })
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.find({
      processName: 'test-process',
      maxRuntime: 1000,
      queue: 'default',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedBy: 'test-process' }),
      }),
    )
  })

  it('locks the job with a current timestamp', async () => {
    const mockJob = { id: 1, attempts: 0 }
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(mockJob)
    const updateSpy = vi
      .spyOn(mockDb.backgroundJob, 'updateMany')
      .mockReturnValue({ count: 1 })
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.find({
      processName: 'test-process',
      maxRuntime: 1000,
      queue: 'default',
    })

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedAt: new Date() }),
      }),
    )
  })
})

const mockPrismaJob = {
  id: 1,
  handler: '',
  args: undefined,
  attempts: 10,
  runAt: new Date(),
  lockedAt: new Date(),
  lockedBy: 'test-process',
  lastError: null,
  failedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('success()', () => {
  it('deletes the job from the DB', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'delete')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.success(mockPrismaJob)

    expect(spy).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

describe('failure()', () => {
  it('updates the job by id', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    )
  })

  it('clears the lock fields', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedAt: null, lockedBy: null }),
      }),
    )
  })

  it('reschedules the job at a designated backoff time', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runAt: new Date(new Date().getTime() + 1000 * 10 ** 4),
        }),
      }),
    )
  })

  it('records the error', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: expect.stringContaining('test error'),
        }),
      }),
    )
  })

  it('nullifies runtAt if max attempts reached', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'), {
      maxAttempts: 10,
    })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runAt: null,
        }),
      }),
    )
  })

  it('marks the job as failed if max attempts reached', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'), {
      maxAttempts: 10,
      deleteFailedJobs: false,
    })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedAt: new Date(),
        }),
      }),
    )
  })

  it('deletes the job if max attempts reached and deleteFailedJobs set to true', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'delete')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure(mockPrismaJob, new Error('test error'), {
      maxAttempts: 10,
      deleteFailedJobs: true,
    })

    expect(spy).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

describe('clear()', () => {
  it('deletes all jobs from the DB', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'deleteMany')

    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.clear()

    expect(spy).toHaveBeenCalledOnce()
  })
})

describe('backoffMilliseconds()', () => {
  it('returns the number of milliseconds to wait for the next run', () => {
    expect(new PrismaAdapter({ db: mockDb }).backoffMilliseconds(0)).toEqual(0)
    expect(new PrismaAdapter({ db: mockDb }).backoffMilliseconds(1)).toEqual(
      1000,
    )
    expect(new PrismaAdapter({ db: mockDb }).backoffMilliseconds(2)).toEqual(
      16000,
    )
    expect(new PrismaAdapter({ db: mockDb }).backoffMilliseconds(3)).toEqual(
      81000,
    )
    expect(new PrismaAdapter({ db: mockDb }).backoffMilliseconds(20)).toEqual(
      160000000,
    )
  })
})
