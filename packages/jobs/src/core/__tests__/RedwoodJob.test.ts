import { describe, expect, vi, it, beforeEach } from 'vitest'

import type CliHelpers from '@redwoodjs/cli-helpers'

import * as errors from '../errors'
import { RedwoodJob } from '../RedwoodJob'

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal<typeof CliHelpers>()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => true,
  }
})

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

const mockLogger = {
  log: vi.fn(() => {}),
  info: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
}

const mockAdapter = {
  options: {},
  logger: mockLogger,
  schedule: vi.fn(() => {}),
  find: () => null,
  clear: () => {},
  success: (_job: { handler: string; args: any }) => {},
  failure: (_job: { handler: string; args: any }, _error: Error) => {},
}

const jobConfig = {
  adapter: mockAdapter,
  logger: mockLogger,
}

class TestJob extends RedwoodJob {
  async perform() {
    return 'done'
  }
}

describe('static config', () => {
  it('can set the adapter', () => {
    RedwoodJob.config(jobConfig)

    expect(RedwoodJob.adapter).toEqual(jobConfig.adapter)
  })

  it('can set the logger', () => {
    RedwoodJob.config(jobConfig)

    expect(RedwoodJob.logger).toEqual(jobConfig.logger)
  })
})

describe('constructor()', () => {
  it('returns an instance of the job', () => {
    const job = new TestJob()
    expect(job).toBeInstanceOf(RedwoodJob)
  })

  it('defaults some options', () => {
    const job = new TestJob()
    expect(job.options).toEqual({
      queue: RedwoodJob.queue,
      priority: RedwoodJob.priority,
    })
  })

  it('can set options for the job', () => {
    const job = new TestJob({ wait: 5 })
    expect(job.options.wait).toEqual(5)
  })
})

describe('static set()', () => {
  it('returns a job instance', () => {
    const job = TestJob.set({ wait: 300 })

    expect(job).toBeInstanceOf(TestJob)
  })

  it('sets options for the job', () => {
    const job = TestJob.set({ runAt: new Date(700) })

    expect(job.options.runAt?.getTime()).toEqual(new Date(700).getTime())
  })

  it('sets the default queue', () => {
    const job = TestJob.set({ priority: 3 })

    expect(job.options.queue).toEqual(TestJob.queue)
  })

  it('sets the default priority', () => {
    const job = TestJob.set({ queue: 'bar' })

    expect(job.options.priority).toEqual(TestJob.priority)
  })

  it('can override the queue name set in the class', () => {
    const job = TestJob.set({ priority: 5, queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  it('can override the priority set in the class', () => {
    const job = TestJob.set({ queue: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('instance set()', () => {
  it('returns a job instance', () => {
    const job = new TestJob().set({ wait: 300 })

    expect(job).toBeInstanceOf(TestJob)
  })

  it('sets options for the job', () => {
    const job = new TestJob().set({ runAt: new Date(700) })

    expect(job.options.runAt?.getTime()).toEqual(new Date(700).getTime())
  })

  it('sets the default queue', () => {
    const job = new TestJob().set({ foo: 'bar' })

    expect(job.options.queue).toEqual(TestJob.queue)
  })

  it('sets the default priority', () => {
    const job = new TestJob().set({ foo: 'bar' })

    expect(job.options.priority).toEqual(TestJob.priority)
  })

  it('can override the queue name set in the class', () => {
    const job = new TestJob().set({ foo: 'bar', queue: 'priority' })

    expect(job.options.queue).toEqual('priority')
  })

  it('can override the priority set in the class', () => {
    const job = new TestJob().set({ foo: 'bar', priority: 10 })

    expect(job.options.priority).toEqual(10)
  })
})

describe('get runAt()', () => {
  it('returns the current time if no options are set', () => {
    const job = new TestJob()

    expect(job.runAt).toEqual(new Date())
  })

  it('returns a datetime `wait` seconds in the future if option set', async () => {
    const job = TestJob.set({ wait: 300 })

    expect(job.runAt).toEqual(new Date(Date.UTC(2024, 0, 1, 0, 5, 0)))
  })

  it('returns a datetime set to `waitUntil` if option set', async () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = TestJob.set({
      waitUntil: futureDate,
    })

    expect(job.runAt).toEqual(futureDate)
  })

  it('returns any datetime set directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new TestJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  it('sets the computed time in the `options` property', () => {
    const job = new TestJob()
    const runAt = job.runAt

    expect(job.options.runAt).toEqual(runAt)
  })
})

describe('set runAt()', () => {
  it('allows manually setting runAt time directly on the instance', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new TestJob()
    job.runAt = futureDate

    expect(job.runAt).toEqual(futureDate)
  })

  it('sets the `options.runAt` property', () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new TestJob()
    job.runAt = futureDate

    expect(job.options.runAt).toEqual(futureDate)
  })
})

describe('get queue()', () => {
  it('defaults to queue set in class', () => {
    const job = new TestJob()

    expect(job.queue).toEqual(TestJob.queue)
  })

  it('allows manually setting the queue name on an instance', () => {
    const job = new TestJob()
    job.queue = 'priority'

    expect(job.queue).toEqual('priority')
  })

  it('prefers the queue set manually over queue set as an option', () => {
    const job = TestJob.set({ queue: 'priority' })
    job.queue = 'important'

    expect(job.queue).toEqual('important')
  })
})

describe('set queue()', () => {
  it('sets the queue name in `options.queue`', () => {
    const job = new TestJob()
    job.queue = 'priority'

    expect(job.options.queue).toEqual('priority')
  })
})

describe('get priority()', () => {
  it('defaults to priority set in class', () => {
    const job = new TestJob()

    expect(job.priority).toEqual(TestJob.priority)
  })

  it('allows manually setting the priority name on an instance', () => {
    const job = new TestJob()
    job.priority = 10

    expect(job.priority).toEqual(10)
  })

  it('prefers priority set manually over priority set as an option', () => {
    const job = TestJob.set({ priority: 20 })
    job.priority = 10

    expect(job.priority).toEqual(10)
  })
})

describe('set priority()', () => {
  it('sets the priority in `options.priority`', () => {
    const job = new TestJob()
    job.priority = 10

    expect(job.options.priority).toEqual(10)
  })
})

describe('static performLater()', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('invokes the instance performLater()', () => {
    const spy = vi.spyOn(TestJob.prototype, 'performLater')
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })

    TestJob.performLater('foo', 'bar')

    expect(spy).toHaveBeenCalledWith('foo', 'bar')
  })
})

describe('instance performLater()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws an error if no adapter is configured', async () => {
    // @ts-expect-error - testing JS scenario
    TestJob.config({ adapter: undefined, logger: mockLogger })

    const job = new TestJob()

    expect(() => job.performLater('foo', 'bar')).toThrow(
      errors.AdapterNotConfiguredError,
    )
  })

  it('logs that the job is being scheduled', async () => {
    TestJob.config({ adapter: mockAdapter, logger: mockLogger })

    await new TestJob().performLater('foo', 'bar')

    expect(mockLogger.info).toHaveBeenCalledWith(
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
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })

    await new TestJob().performLater('foo', 'bar')

    expect(mockAdapter.schedule).toHaveBeenCalledWith({
      handler: 'TestJob',
      args: ['foo', 'bar'],
      queue: 'default',
      priority: 50,
      runAt: new Date(),
    })
  })

  it('returns whatever the adapter returns', async () => {
    const scheduleReturn = { status: 'scheduled' }
    const adapter = {
      ...mockAdapter,
      schedule: vi.fn(() => scheduleReturn),
    }
    TestJob.config({ adapter, logger: mockLogger })

    const result = await new TestJob().performLater('foo', 'bar')

    expect(result).toEqual(scheduleReturn)
  })

  it('catches any errors thrown during schedulding and throws custom error', async () => {
    const adapter = {
      ...mockAdapter,
      schedule: vi.fn(() => {
        throw new Error('Could not schedule')
      }),
    }
    RedwoodJob.config({ adapter, logger: mockLogger })

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
    const spy = vi.spyOn(TestJob.prototype, 'performNow')
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
    // @ts-expect-error - testing JS scenario
    class TestJob extends RedwoodJob {}
    const job = new TestJob()

    expect(() => job.perform('foo', 'bar')).toThrow(TypeError)
  })

  it('re-throws perform() error from performNow() if perform() function is not implemented', async () => {
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })

    // @ts-expect-error - testing JS scenario
    class TestJob extends RedwoodJob {}
    const job = new TestJob()

    expect(() => job.performNow('foo', 'bar')).toThrow(TypeError)
  })

  it('logs that the job is being run', async () => {
    TestJob.config({ adapter: mockAdapter, logger: mockLogger })

    await new TestJob().performNow('foo', 'bar')

    expect(mockLogger.info).toHaveBeenCalledWith(
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
    class TestJobPerf extends RedwoodJob {
      perform() {
        throw new Error('Could not perform')
      }
    }
    const adapter = {
      ...mockAdapter,
      schedule: vi.fn(() => {
        throw new Error('Could not schedule')
      }),
    }

    RedwoodJob.config({ adapter, logger: mockLogger })

    try {
      new TestJobPerf().performNow('foo', 'bar')
    } catch (e) {
      expect(e).toBeInstanceOf(errors.PerformError)
      expect(e.message).toEqual('[TestJobPerf] exception when running job')
      expect(e.originalError.message).toEqual('Could not perform')
    }
  })
})

describe('perform()', () => {
  it('throws an error if not implemented', () => {
    // @ts-expect-error - testing JS scenario
    const job = new RedwoodJob()

    expect(() => job.perform()).toThrow(TypeError)
  })
})

describe('subclasses', () => {
  it('can set its own queue', () => {
    class MailerJob extends RedwoodJob {
      static queue = 'mailers'

      perform() {
        return 'done'
      }
    }

    // class access
    expect(MailerJob.queue).toEqual('mailers')
    expect(RedwoodJob.queue).toEqual('default')

    // instance access (not including RedwoodJob here, becuase it can't be
    // instantiated since it's abstract)
    const mailerJob = new MailerJob()
    expect(mailerJob.queue).toEqual('mailers')
  })

  it('can set its own priority', () => {
    class PriorityJob extends RedwoodJob {
      static priority = 10

      perform() {
        return 'done'
      }
    }

    // class access
    expect(PriorityJob.priority).toEqual(10)
    expect(RedwoodJob.priority).toEqual(50)

    // instance access (again, not testing RedwoodJob. See comment above)
    const priorityJob = new PriorityJob()
    expect(priorityJob.priority).toEqual(10)
  })
})
