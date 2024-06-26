import { db } from 'src/lib/db'

import * as errors from '../../core/errors'
import {
  PrismaAdapter,
  DEFAULT_MODEL_NAME,
  DEFAULT_MAX_ATTEMPTS,
} from '../PrismaAdapter'

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'))

describe('constructor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('defaults this.model name', () => {
    const adapter = new PrismaAdapter({ db })

    expect(adapter.model).toEqual(DEFAULT_MODEL_NAME)
  })

  test('can manually set this.model', () => {
    const dbMock = jest.fn(() => ({
      _runtimeDataModel: {
        models: {
          Job: {
            dbName: null,
          },
        },
      },
      job: {},
    }))
    const adapter = new PrismaAdapter({
      db: dbMock(),
      model: 'Job',
    })

    expect(adapter.model).toEqual('Job')
  })

  test('throws an error with a model name that does not exist', () => {
    expect(() => new PrismaAdapter({ db, model: 'FooBar' })).toThrow(
      errors.ModelNameError,
    )
  })

  test('sets this.accessor to the correct Prisma accessor', () => {
    const adapter = new PrismaAdapter({ db })

    expect(adapter.accessor).toEqual(db.backgroundJob)
  })

  test('manually set this.tableName ', () => {
    const adapter = new PrismaAdapter({ db, tableName: 'background_jobz' })

    expect(adapter.tableName).toEqual('background_jobz')
  })

  test('set this.tableName from custom @@map() name in schema', () => {
    const dbMock = jest.fn(() => ({
      _runtimeDataModel: {
        models: {
          BackgroundJob: {
            dbName: 'bg_jobs',
          },
        },
      },
    }))
    const adapter = new PrismaAdapter({
      db: dbMock(),
    })

    expect(adapter.tableName).toEqual('bg_jobs')
  })

  test('default this.tableName to camelCase version of model name', () => {
    const adapter = new PrismaAdapter({ db })

    expect(adapter.tableName).toEqual('BackgroundJob')
  })

  test('sets this.provider based on the active provider', () => {
    const adapter = new PrismaAdapter({ db })

    expect(adapter.provider).toEqual('sqlite')
  })

  test('defaults this.maxAttempts', () => {
    const adapter = new PrismaAdapter({ db })

    expect(adapter.maxAttempts).toEqual(DEFAULT_MAX_ATTEMPTS)
  })

  test('can manually set this.maxAttempts', () => {
    const adapter = new PrismaAdapter({ db, maxAttempts: 10 })

    expect(adapter.maxAttempts).toEqual(10)
  })
})

describe('schedule()', () => {
  afterEach(async () => {
    await db.backgroundJob.deleteMany()
  })

  test('creates a job in the DB', async () => {
    const adapter = new PrismaAdapter({ db })
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
    const adapter = new PrismaAdapter({ db })
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
    const adapter = new PrismaAdapter({ db })
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
    const adapter = new PrismaAdapter({ db })
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

  scenario('returns null if no job found', async () => {
    const adapter = new PrismaAdapter({ db })
    const job = await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: 'foobar',
    })
    expect(job).toBeNull()
  })

  scenario('returns a job if conditions met', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    const job = await adapter.find({
      processName: 'test',
      maxRuntime: 1000,
      queue: scenario.backgroundJob.email.queue,
    })
    expect(job.id).toEqual(scenario.backgroundJob.email.id)
  })

  scenario(
    'increments the `attempts` count on the found job',
    async (scenario) => {
      const adapter = new PrismaAdapter({ db })
      const job = await adapter.find({
        processName: 'test',
        maxRuntime: 1000,
        queue: scenario.backgroundJob.email.queue,
      })
      expect(job.attempts).toEqual(scenario.backgroundJob.email.attempts + 1)
    },
  )

  scenario('locks the job for the current process', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    const job = await adapter.find({
      processName: 'test-process',
      maxRuntime: 1000,
      queue: scenario.backgroundJob.email.queue,
    })
    expect(job.lockedBy).toEqual('test-process')
  })

  scenario('locks the job with a current timestamp', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    const job = await adapter.find({
      processName: 'test-process',
      maxRuntime: 1000,
      queue: scenario.backgroundJob.email.queue,
    })
    expect(job.lockedAt).toEqual(new Date())
  })
})

describe('success()', () => {
  scenario('deletes the job from the DB', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    const job = await adapter.success(scenario.backgroundJob.email)
    const dbJob = await db.backgroundJob.findFirst({
      where: { id: job.id },
    })

    expect(dbJob).toBeNull()
  })
})

describe('failure()', () => {
  scenario('clears the lock fields', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    await adapter.failure(
      scenario.backgroundJob.multipleAttempts,
      new Error('test error'),
    )
    const dbJob = await db.backgroundJob.findFirst({
      where: { id: scenario.backgroundJob.multipleAttempts.id },
    })

    expect(dbJob.lockedAt).toBeNull()
    expect(dbJob.lockedBy).toBeNull()
  })

  scenario(
    'reschedules the job at a designated backoff time',
    async (scenario) => {
      const adapter = new PrismaAdapter({ db })
      await adapter.failure(
        scenario.backgroundJob.multipleAttempts,
        new Error('test error'),
      )
      const dbJob = await db.backgroundJob.findFirst({
        where: { id: scenario.backgroundJob.multipleAttempts.id },
      })

      expect(dbJob.runAt).toEqual(
        new Date(
          new Date().getTime() +
            1000 * scenario.backgroundJob.multipleAttempts.attempts ** 4,
        ),
      )
    },
  )

  scenario('records the error', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    await adapter.failure(
      scenario.backgroundJob.multipleAttempts,
      new Error('test error'),
    )
    const dbJob = await db.backgroundJob.findFirst({
      where: { id: scenario.backgroundJob.multipleAttempts.id },
    })

    expect(dbJob.lastError).toContain('test error\n\n')
  })

  scenario(
    'marks the job as failed if max attempts reached',
    async (scenario) => {
      const adapter = new PrismaAdapter({ db })
      await adapter.failure(
        scenario.backgroundJob.maxAttempts,
        new Error('test error'),
      )
      const dbJob = await db.backgroundJob.findFirst({
        where: { id: scenario.backgroundJob.maxAttempts.id },
      })

      expect(dbJob.failedAt).toEqual(new Date())
    },
  )

  scenario('nullifies runtAt if max attempts reached', async (scenario) => {
    const adapter = new PrismaAdapter({ db })
    await adapter.failure(
      scenario.backgroundJob.maxAttempts,
      new Error('test error'),
    )
    const dbJob = await db.backgroundJob.findFirst({
      where: { id: scenario.backgroundJob.maxAttempts.id },
    })

    expect(dbJob.runAt).toBeNull()
  })
})

describe('clear()', () => {
  scenario('deletes all jobs from the DB', async () => {
    const adapter = new PrismaAdapter({ db })
    await adapter.clear()
    const jobCount = await db.backgroundJob.count()

    expect(jobCount).toEqual(0)
  })
})

describe('backoffMilliseconds()', () => {
  test('returns the number of milliseconds to wait for the next run', () => {
    expect(new PrismaAdapter({ db }).backoffMilliseconds(0)).toEqual(0)
    expect(new PrismaAdapter({ db }).backoffMilliseconds(1)).toEqual(1000)
    expect(new PrismaAdapter({ db }).backoffMilliseconds(2)).toEqual(16000)
    expect(new PrismaAdapter({ db }).backoffMilliseconds(3)).toEqual(81000)
    expect(new PrismaAdapter({ db }).backoffMilliseconds(20)).toEqual(160000000)
  })
})
