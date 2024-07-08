import { describe, expect, vi, it, beforeEach } from 'vitest'

import * as errors from '../../core/errors'
import { RedwoodJob } from '../RedwoodJob'

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

describe('static config', () => {
  it('can set the adapter', () => {
    const adapter = { schedule: vi.fn() }

    RedwoodJob.config({ adapter })

    expect(RedwoodJob.adapter).toEqual(adapter)
  })

  it('can set the logger', () => {
    const logger = { info: vi.fn() }

    RedwoodJob.config({ logger })

    expect(RedwoodJob.logger).toEqual(logger)
  })

  it('can explictly set the adapter to falsy values for testing', () => {
    RedwoodJob.config({ adapter: null })
    expect(RedwoodJob.adapter).toBeNull()

    RedwoodJob.config({ adapter: undefined })
    expect(RedwoodJob.adapter).toBeUndefined()

    RedwoodJob.config({ adapter: false })
    expect(RedwoodJob.adapter).toEqual(false)
  })
})

describe('constructor()', () => {
  it('returns an instance of the job', () => {
    const job = new RedwoodJob()
    expect(job).toBeInstanceOf(RedwoodJob)
  })

  it('defaults some options', () => {
    const job = new RedwoodJob()
    expect(job.options).toEqual({
      queue: RedwoodJob.queue,
      priority: RedwoodJob.priority,
    })
  })

  it('can set options for the job', () => {
    const job = new RedwoodJob({ foo: 'bar' })
    expect(job.options.foo).toEqual('bar')
  })
})

describe('static set()', () => {
  it('returns a job instance', () => {
    const job = RedwoodJob.set({ wait: 300 })

    expect(job).toBeInstanceOf(RedwoodJob)
  })

  it('sets options for the job', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.foo).toEqual('bar')
  })

  it('sets the default queue', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.queue).toEqual(RedwoodJob.queue)
  })

  it('sets the default priority', () => {
    const job = RedwoodJob.set({ foo: 'bar' })

    expect(job.options.priority).toEqual(RedwoodJob.priority)
  })

  it('can override the queue name set in the class', () => {
    const job = RedwoodJob.set({ foo: 'bar', queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  it('can override the priority set in the class', () => {
    const job = RedwoodJob.set({ foo: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('instance set()', () => {
  it('returns a job instance', () => {
    const job = new RedwoodJob().set({ wait: 300 })

    expect(job).toBeInstanceOf(RedwoodJob)
  })

  it('sets options for the job', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.foo).toEqual('bar')
  })

  it('sets the default queue', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.queue).toEqual(RedwoodJob.queue)
  })

  it('sets the default priority', () => {
    const job = new RedwoodJob().set({ foo: 'bar' })

    expect(job.options.priority).toEqual(RedwoodJob.priority)
  })

  it('can override the queue name set in the class', () => {
    const job = new RedwoodJob().set({ foo: 'bar', queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  it('can override the priority set in the class', () => {
    const job = new RedwoodJob().set({ foo: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('get runAt()', () => {
  it('returns the current time if no options are set', () => {
    const job = new RedwoodJob()

    expect(job.runAt).toEqual(new Date())
  })

  it('returns a datetime `wait` seconds in the future if option set', async () => {
    const job = RedwoodJob.set({ wait: 300 })

    expect(job.runAt).toEqual(new Date(Date.UTC(2024, 0, 1, 0, 5, 0)))
  })

  it('returns a datetime set to `waitUntil` if option set', async () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = RedwoodJob.set({
      waitUntil: futureDate,
    })

    expect(job.runAt).toEqual(futureDate)
  })

  it('returns any datetime set directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  it('sets the computed time in the `options` property', () => {
    const job = new RedwoodJob()
    const runAt = job.runAt

    expect(job.options.runAt).toEqual(runAt)
  })
})

describe('set runAt()', () => {
  it('allows manually setting runAt time directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  it('sets the `options.runAt` property', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new RedwoodJob()
    job.runAt = futureDate

    expect(job.options.runAt).toEqual(futureDate)
  })
})

describe('get queue()', () => {
  it('defaults to queue set in class', () => {
    const job = new RedwoodJob()

    expect(job.queue).toEqual(RedwoodJob.queue)
  })

  it('allows manually setting the queue name on an instance', () => {
    const job = new RedwoodJob()
    job.queue = 'priority'

    expect(job.queue).toEqual('priority')
  })

  it('prefers the queue set manually over queue set as an option', () => {
    const job = RedwoodJob.set({ queue: 'priority' })
    job.queue = 'important'

    expect(job.queue).toEqual('important')
  })
})

describe('set queue()', () => {
  it('sets the queue name in `options.queue`', () => {
    const job = new RedwoodJob()
    job.queue = 'priority'

    expect(job.options.queue).toEqual('priority')
  })
})

describe('get priority()', () => {
  it('defaults to priority set in class', () => {
    const job = new RedwoodJob()

    expect(job.priority).toEqual(RedwoodJob.priority)
  })

  it('allows manually setting the priority name on an instance', () => {
    const job = new RedwoodJob()
    job.priority = 10

    expect(job.priority).toEqual(10)
  })

  it('prefers priority set manually over priority set as an option', () => {
    const job = RedwoodJob.set({ priority: 20 })
    job.priority = 10

    expect(job.priority).toEqual(10)
  })
})

describe('set priority()', () => {
  it('sets the priority in `options.priority`', () => {
    const job = new RedwoodJob()
    job.priority = 10

    expect(job.options.priority).toEqual(10)
  })
})

describe('static performLater()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes the instance performLater()', () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const spy = vi.spyOn(TestJob.prototype, 'performLater')
    const mockAdapter = { schedule: vi.fn() }
    RedwoodJob.config({ adapter: mockAdapter })

    TestJob.performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })
})

describe('instance performLater()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an error if no adapter is configured', async () => {
    RedwoodJob.config({ adapter: undefined })

    const job = new RedwoodJob()

    expect(() => job.performLater('foo', 'bar')).toThrow(
      errors.AdapterNotConfiguredError,
    )
  })

  it('logs that the job is being scheduled', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: vi.fn() }
    const mockLogger = { info: vi.fn() }
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })
    const spy = vi.spyOn(mockLogger, 'info')

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

  it('calls the `schedule` function on the adapter', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: vi.fn() }
    RedwoodJob.config({ adapter: mockAdapter })
    const spy = vi.spyOn(mockAdapter, 'schedule')

    await new TestJob().performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith({
      handler: 'TestJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })
  })

  it('returns whatever the adapter returns', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const scheduleReturn = { status: 'scheduled' }
    const mockAdapter = {
      schedule: vi.fn(() => scheduleReturn),
    }
    RedwoodJob.config({ adapter: mockAdapter })

    const result = await new TestJob().performLater('foo', 'bar')

    expect(result).toEqual(scheduleReturn)
  })

  it('catches any errors thrown during schedulding and throws custom error', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = {
      schedule: vi.fn(() => {
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
      expect(e.originalError.message).toEqual('Could not schedule')
    }
  })
})

describe('static performNow()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes the instance performNow()', () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const spy = vi.spyOn(TestJob.prototype, 'performNow')
    const mockAdapter = { schedule: vi.fn() }
    RedwoodJob.config({ adapter: mockAdapter })

    TestJob.performNow('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })
})

describe('instance performNow()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an error if perform() function is not implemented', async () => {
    class TestJob extends RedwoodJob {}
    const job = new TestJob()

    expect(() => job.performNow('foo', 'bar')).toThrow(
      errors.PerformNotImplementedError,
    )
  })

  it('logs that the job is being run', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }
    const mockAdapter = { schedule: vi.fn() }
    const mockLogger = { info: vi.fn() }
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })
    const spy = vi.spyOn(mockLogger, 'info')

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

  it('invokes the perform() function immediately', async () => {
    class TestJob extends RedwoodJob {
      async perform() {
        return 'done'
      }
    }

    const spy = vi.spyOn(TestJob.prototype, 'perform')

    await new TestJob().performNow('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })

  it('returns whatever the perform() function returns', async () => {
    const performReturn = { status: 'done' }
    class TestJob extends RedwoodJob {
      async perform() {
        return performReturn
      }
    }

    const result = await new TestJob().performNow('foo', 'bar')

    expect(result).toEqual(performReturn)
  })

  it('catches any errors thrown during perform and throws custom error', async () => {
    class TestJob extends RedwoodJob {
      perform() {
        throw new Error('Could not perform')
      }
    }
    const mockAdapter = {
      schedule: vi.fn(() => {
        throw new Error('Could not schedule')
      }),
    }
    RedwoodJob.config({ adapter: mockAdapter })

    try {
      new TestJob().performNow('foo', 'bar')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.PerformError)
      expect(e.message).toEqual('[TestJob] exception when running job')
      expect(e.originalError.message).toEqual('Could not perform')
    }
  })
})

describe('perform()', () => {
  it('throws an error if not implemented', () => {
    const job = new RedwoodJob()

    expect(() => job.perform()).toThrow(errors.PerformNotImplementedError)
  })
})

describe('subclasses', () => {
  it('can set its own queue', () => {
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

  it('can set its own priority', () => {
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
