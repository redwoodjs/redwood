import * as errors from '../../core/errors'
import { RedwoodJob } from '../RedwoodJob'

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'))

describe('static config', () => {
  test('can set the adapter', () => {
    const adapter = { schedule: jest.fn() }

    RedwoodJob.config({ adapter })

    expect(RedwoodJob.adapter).toEqual(adapter)
  })

  test('can set the logger', () => {
    const logger = { info: jest.fn() }

    RedwoodJob.config({ logger })

    expect(RedwoodJob.logger).toEqual(logger)
  })

  test('can explictly set the adapter to falsy values for testing', () => {
    RedwoodJob.config({ adapter: null })
    expect(RedwoodJob.adapter).toBeNull()

    RedwoodJob.config({ adapter: undefined })
    expect(RedwoodJob.adapter).toBeUndefined()

    RedwoodJob.config({ adapter: false })
    expect(RedwoodJob.adapter).toEqual(false)
  })
})

describe('constructor()', () => {
  test('returns an instance of the job', () => {
    const job = new RedwoodJob()
    expect(job).toBeInstanceOf(RedwoodJob)
  })

  test('defaults some options', () => {
    const job = new RedwoodJob()
    expect(job.options).toEqual({
      queue: RedwoodJob.queue,
      priority: RedwoodJob.priority,
    })
  })

  test('can set options for the job', () => {
    const job = new RedwoodJob({ foo: 'bar' })
    expect(job.options.foo).toEqual('bar')
  })
})

describe('static set()', () => {
  test('returns a job instance', () => {
    const job = RedwoodJob.set({ wait: 300 })

    expect(job).toBeInstanceOf(RedwoodJob)
  })

  test('sets options for the job', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.foo).toEqual('bar')
  })

  test('sets the default queue', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.queue).toEqual(RedwoodJob.queue)
  })

  test('sets the default priority', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.priority).toEqual(RedwoodJob.priority)
  })

  test('can override the queue name set in the class', () => {
    const job = RedwoodJob.set({ foo: 'bar', queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  test('can override the priority set in the class', () => {
    const job = RedwoodJob.set({ foo: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('instance set()', () => {
  test('returns a job instance', () => {
    const job = new RedwoodJob().set({ wait: 300 })

    expect(job).toBeInstanceOf(RedwoodJob)
  })

  test('sets options for the job', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.foo).toEqual('bar')
  })

  test('sets the default queue', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.queue).toEqual(RedwoodJob.queue)
  })

  test('sets the default priority', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.priority).toEqual(RedwoodJob.priority)
  })

  test('can override the queue name set in the class', () => {
    const job = new RedwoodJob().set({ foo: 'bar', queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  test('can override the priority set in the class', () => {
    const job = new RedwoodJob().set({ foo: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('get runAt()', () => {
  test('returns the current time if no options are set', () => {
    const job = new RedwoodJob()

    expect(job.runAt).toEqual(new Date())
  })

  test.only('returns a datetime `wait` seconds in the future if option set', async () => {
    const job = RedwoodJob.set({ wait: 300 })

    console.info(job.runAt)

    expect(job.runAt).toEqual(new Date(new Date().getTime() + 300 * 1000))
  })

  test('returns a datetime set to `waitUntil` if option set', async () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = RedwoodJob.set({
      waitUntil: futureDate,
    })

    expect(job.runAt).toEqual(futureDate)
  })

  test('returns any datetime set directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  test('sets the computed time in the `options` property', () => {
    const job = new RedwoodJob()
    const runAt = job.runAt

    expect(job.options.runAt).toEqual(runAt)
  })
})

describe('set runAt()', () => {
  test('can set the runAt time directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  test('sets the `options.runAt` property', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.options.runAt).toEqual(futureDate)
  })
})

describe('get queue()', () => {
  test('defaults to queue set in class', () => {
    const job = new RedwoodJob()

    expect(job.queue).toEqual(RedwoodJob.queue)
  })

  test('can manually set the queue name on an instance', () => {
    const job = new RedwoodJob()
    job.queue = 'priority'

    expect(job.queue).toEqual('priority')
  })

  test('queue set manually overrides queue set as an option', () => {
    const job = RedwoodJob.set({ queue: 'priority' })
    job.queue = 'important'

    expect(job.queue).toEqual('important')
  })
})

describe('set queue()', () => {
  test('sets the queue name in `options.queue`', () => {
    const job = new RedwoodJob()
    job.queue = 'priority'

    expect(job.options.queue).toEqual('priority')
  })
})

describe('get priority()', () => {
  test('defaults to priority set in class', () => {
    const job = new RedwoodJob()

    expect(job.priority).toEqual(RedwoodJob.priority)
  })

  test('can manually set the priority name on an instance', () => {
    const job = new RedwoodJob()
    job.priority = 10

    expect(job.priority).toEqual(10)
  })

  test('priority set manually overrides priority set as an option', () => {
    const job = RedwoodJob.set({ priority: 20 })
    job.priority = 10

    expect(job.priority).toEqual(10)
  })
})

describe('set priority()', () => {
  test('sets the priority in `options.priority`', () => {
    const job = new RedwoodJob()
    job.priority = 10

    expect(job.options.priority).toEqual(10)
  })
})

describe('static performLater()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('invokes the instance performLater()', () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const spy = jest.spyOn(TestJob.prototype, 'performLater')
    const mockAdapter = { schedule: jest.fn() }
    RedwoodJob.config({ adapter: mockAdapter })

    TestJob.performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })
})

describe('instance performLater()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('throws an error if no adapter is configured', async () => {
    RedwoodJob.config({ adapter: undefined })

    const job = new RedwoodJob()

    await expect(job.performLater('foo', 'bar')).rejects.toThrow(
      errors.AdapterNotConfiguredError,
    )
  })

  test('logs that the job is being scheduled', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: jest.fn() }
    const mockLogger = { info: jest.fn() }
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })
    const spy = jest.spyOn(mockLogger, 'info')

    await new TestJob().performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith(
      {
        args: ['foo', 'bar'],
        handler: 'TestJob',
        priority: 50,
        queue: 'default',
        runAt: new Date(),
      },
      '[RedwoodJob] Scheduling TestJob',
    )
  })

  test('calls the `schedule` function on the adapter', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: jest.fn() }
    RedwoodJob.config({ adapter: mockAdapter })
    const spy = jest.spyOn(mockAdapter, 'schedule')

    await new TestJob().performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith({
      handler: 'TestJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })
  })

  test('returns whatever the adapter returns', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const scheduleReturn = { status: 'scheduled' }
    const mockAdapter = {
      schedule: jest.fn(() => scheduleReturn),
    }
    RedwoodJob.config({ adapter: mockAdapter })

    const result = await new TestJob().performLater('foo', 'bar')

    expect(result).toEqual(scheduleReturn)
  })

  test('catches any errors thrown during schedulding and throws custom error', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = {
      schedule: jest.fn(() => {
        throw new Error('Could not schedule')
      }),
    }
    RedwoodJob.config({ adapter: mockAdapter })

    try {
      await new TestJob().performLater('foo', 'bar')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.SchedulingError)
      expect(e.message).toEqual(
        '[RedwoodJob] Exception when scheduling TestJob',
      )
      expect(e.original_error.message).toEqual('Could not schedule')
    }
  })
})

describe('static performNow()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('invokes the instance performNow()', () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const spy = jest.spyOn(TestJob.prototype, 'performNow')
    const mockAdapter = { schedule: jest.fn() }
    RedwoodJob.config({ adapter: mockAdapter })

    TestJob.performNow('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })
})

describe('instance performNow()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('throws an error if perform() function is not implemented', async () => {
    class TestJob extends RedwoodJob {}
    const job = new TestJob()

    await expect(job.performNow('foo', 'bar')).rejects.toThrow(
      errors.PerformNotImplementedError,
    )
  })

  test('logs that the job is being run', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: jest.fn() }
    const mockLogger = { info: jest.fn() }
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })
    const spy = jest.spyOn(mockLogger, 'info')

    await new TestJob().performNow('foo', 'bar')

    expect(spy).toHaveBeenCalledWith(
      {
        args: ['foo', 'bar'],
        handler: 'TestJob',
        priority: 50,
        queue: 'default',
        runAt: new Date(),
      },
      '[RedwoodJob] Running TestJob now',
    )
  })

  test('invokes the perform() function immediately', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }

    const spy = jest.spyOn(TestJob.prototype, 'perform')

    await new TestJob().performNow('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })

  test('returns whatever the perform() function returns', async () => {
    const performReturn = { status: 'done' }
    class TestJob extends RedwoodJob {
      async perform() {
        return performReturn
      }
    }

    const result = await new TestJob().performNow('foo', 'bar')

    expect(result).toEqual(performReturn)
  })

  test('catches any errors thrown during perform and throws custom error', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        throw new Error('Could not perform')
      }
    }
    const mockAdapter = {
      schedule: jest.fn(() => {
        throw new Error('Could not schedule')
      }),
    }
    RedwoodJob.config({ adapter: mockAdapter })

    try {
      await new TestJob().performNow('foo', 'bar')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.PerformError)
      expect(e.message).toEqual('[TestJob] exception when running job')
      expect(e.original_error.message).toEqual('Could not perform')
    }
  })
})

describe('perform()', () => {
  test('throws an error if not implemented', () => {
    const job = new RedwoodJob()

    expect(() => job.perform()).toThrow(errors.PerformNotImplementedError)
  })
})

describe('subclasses', () => {
  test('can set their own default queue', () => {
    class MailerJob extends RedwoodJob {
      static queue = 'mailers'
    }

    // class access
    expect(MailerJob.queue).toEqual('mailers')
    expect(RedwoodJob.queue).toEqual('default')

    // instance access
    const mailerJob = new MailerJob()
    const redwoodJob = new RedwoodJob()
    expect(mailerJob.queue).toEqual('mailers')
    expect(redwoodJob.queue).toEqual('default')
  })

  test('can set their own default priority', () => {
    class PriorityJob extends RedwoodJob {
      static priority = 10
    }

    // class access
    expect(PriorityJob.priority).toEqual(10)
    expect(RedwoodJob.priority).toEqual(50)

    // instance access
    const priorityJob = new PriorityJob()
    const redwoodJob = new RedwoodJob()
    expect(priorityJob.priority).toEqual(10)
    expect(redwoodJob.priority).toEqual(50)
  })
})
