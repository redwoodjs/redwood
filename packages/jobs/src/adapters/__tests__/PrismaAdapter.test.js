import { describe, expect, vi, test, beforeEach, afterEach } from 'vitest'

import * as errors from '../../core/errors'
import {
  PrismaAdapter,
  DEFAULT_MODEL_NAME,
  DEFAULT_MAX_ATTEMPTS,
} from '../PrismaAdapter'

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

// test data
// export const standard = defineScenario({
//   backgroundJob: {
//     email: {
//       data: {
//         id: 1,
//         handler: JSON.stringify({ handler: 'EmailJob', args: [123] }),
//         queue: 'email',
//         priority: 50,
//         runAt: '2021-04-30T15:35:19Z',
//       },
//     },

//     multipleAttempts: {
//       data: {
//         id: 2,
//         attempts: 10,
//         handler: JSON.stringify({ handler: 'TestJob', args: [123] }),
//         queue: 'default',
//         priority: 50,
//         runAt: '2021-04-30T15:35:19Z',
//       },
//     },

//     maxAttempts: {
//       data: {
//         id: 3,
//         attempts: 24,
//         handler: JSON.stringify({ handler: 'TestJob', args: [123] }),
//         queue: 'default',
//         priority: 50,
//         runAt: '2021-04-30T15:35:19Z',
//       },
//     },
//   },
// })

// test('truth', () => {
//   expect(true)
// })

let mockDb

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
  test('defaults this.model name', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.model).toEqual(DEFAULT_MODEL_NAME)
  })

  test('can manually set this.model', () => {
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

  test('throws an error with a model name that does not exist', () => {
    expect(() => new PrismaAdapter({ db: mockDb, model: 'FooBar' })).toThrow(
      errors.ModelNameError,
    )
  })

  test('sets this.accessor to the correct Prisma accessor', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.accessor).toEqual(mockDb.backgroundJob)
  })

  test('manually set this.tableName ', () => {
    const adapter = new PrismaAdapter({
      db: mockDb,
      tableName: 'background_jobz',
    })

    expect(adapter.tableName).toEqual('background_jobz')
  })

  test('set this.tableName from custom @@map() name in schema', () => {
    mockDb._runtimeDataModel.models.BackgroundJob.dbName = 'bg_jobs'
    const adapter = new PrismaAdapter({
      db: mockDb,
    })

    expect(adapter.tableName).toEqual('bg_jobs')
  })

  test('default this.tableName to camelCase version of model name', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.tableName).toEqual('BackgroundJob')
  })

  test('sets this.provider based on the active provider', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.provider).toEqual('sqlite')
  })

  test('defaults this.maxAttempts', () => {
    const adapter = new PrismaAdapter({ db: mockDb })

    expect(adapter.maxAttempts).toEqual(DEFAULT_MAX_ATTEMPTS)
  })

  test('can manually set this.maxAttempts', () => {
    const adapter = new PrismaAdapter({ db: mockDb, maxAttempts: 10 })

    expect(adapter.maxAttempts).toEqual(10)
  })
})

describe.skip('schedule()', () => {
  afterEach(async () => {
    await db.backgroundJob.deleteMany()
  })

  test('creates a job in the DB', async () => {
    const adapter = new PrismaAdapter({ db: mockDb })
    const beforeJobCount = await db.backgroundJob.count()
    await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })
    const afterJobCount = await db.backgroundJob.count()

    expect(afterJobCount).toEqual(beforeJobCount + 1)
  })

  test('returns the job record that was created', async () => {
    const adapter = new PrismaAdapter({ db: mockDb })
    const job = await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })

    expect(job.handler).toEqual('{"handler":"RedwoodJob","args":["foo","bar"]}')
    expect(job.runAt).toEqual(new Date())
    expect(job.queue).toEqual('default')
    expect(job.priority).toEqual(50)
  })

  test('makes no attempt to de-dupe jobs', async () => {
    const adapter = new PrismaAdapter({ db: mockDb })
    const job1 = await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })
    const job2 = await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })

    // definitely a different record in the DB
    expect(job1.id).not.toEqual(job2.id)
    // but all details are identical
    expect(job1.handler).toEqual(job2.handler)
    expect(job1.queue).toEqual(job2.queue)
    expect(job1.priority).toEqual(job2.priority)
  })

  test('defaults some database fields', async () => {
    const adapter = new PrismaAdapter({ db: mockDb })
    const job = await adapter.schedule({
      handler: 'RedwoodJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })

    expect(job.attempts).toEqual(0)
    expect(job.lockedAt).toBeNull()
    expect(job.lockedBy).toBeNull()
    expect(job.lastError).toBeNull()
    expect(job.failedAt).toBeNull()
  })
})

describe('find()', () => {
  // TODO add more tests for all the various WHERE conditions when finding a job

  test('returns null if no job found', async () => {
    vi.spyOn(mockDb.backgroundJob, 'findFirst').mockReturnValue(null)
    const adapter = new PrismaAdapter({ db: mockDb })
    const job = await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: 'foobar',
    })

    expect(job).toBeNull()
  })

  test('returns a job if found', async () => {
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

  test('increments the `attempts` count on the found job', async () => {
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

  test('locks the job for the current process', async () => {
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

  test('locks the job with a current timestamp', async () => {
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

describe('success()', () => {
  test('deletes the job from the DB', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'delete')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.success({ id: 1 })

    expect(spy).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

describe('failure()', () => {
  test('updates the job by id', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    )
  })

  test('clears the lock fields', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedAt: null, lockedBy: null }),
      }),
    )
  })

  test('reschedules the job at a designated backoff time', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1, attempts: 10 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runAt: new Date(new Date().getTime() + 1000 * 10 ** 4),
        }),
      }),
    )
  })

  test('records the error', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1, attempts: 10 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: expect.stringContaining('test error'),
        }),
      }),
    )
  })

  test('marks the job as failed if max attempts reached', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1, attempts: 24 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedAt: new Date(),
        }),
      }),
    )
  })

  test('nullifies runtAt if max attempts reached', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'update')
    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.failure({ id: 1, attempts: 24 }, new Error('test error'))

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runAt: null,
        }),
      }),
    )
  })
})

describe('clear()', () => {
  test('deletes all jobs from the DB', async () => {
    const spy = vi.spyOn(mockDb.backgroundJob, 'deleteMany')

    const adapter = new PrismaAdapter({ db: mockDb })
    await adapter.clear()

    expect(spy).toHaveBeenCalledOnce()
  })
})

describe('backoffMilliseconds()', () => {
  test('returns the number of milliseconds to wait for the next run', () => {
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
