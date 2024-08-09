import { describe, expect, vi, it, beforeEach } from 'vitest'

import type CliHelpers from '@redwoodjs/cli-helpers'

import { DEFAULT_LOGGER, DEFAULT_QUEUE, DEFAULT_PRIORITY } from '../consts'
import * as errors from '../errors'
import { RedwoodJob } from '../RedwoodJob'

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal<typeof CliHelpers>()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => true,
  }
})

const FAKE_NOW = new Date('2024-01-01')
vi.useFakeTimers().setSystemTime(FAKE_NOW)

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

class TestJob extends RedwoodJob {
  static adapter = mockAdapter

  async perform() {
    return 'done'
  }
}

describe('static properties', () => {
  it('sets a default logger', () => {
    expect(RedwoodJob.logger).toEqual(DEFAULT_LOGGER)
  })

  it('sets a default queue', () => {
    expect(RedwoodJob.queue).toEqual(DEFAULT_QUEUE)
  })

  it('sets a default priority', () => {
    expect(RedwoodJob.priority).toEqual(DEFAULT_PRIORITY)
  })
})

describe('static config()', () => {
  it('can set the adapter', () => {
    RedwoodJob.config({ adapter: mockAdapter })

    expect(RedwoodJob.adapter).toEqual(mockAdapter)
  })

  it('can set the logger', () => {
    RedwoodJob.config({ adapter: mockAdapter, logger: mockLogger })

    expect(RedwoodJob.logger).toEqual(mockLogger)
  })

  it('is inherited by subclasses', () => {
    RedwoodJob.config({ adapter: mockAdapter })

    expect(TestJob.adapter).toEqual(mockAdapter)
  })
})

describe('constructor()', () => {
  it('returns an instance of the job', () => {
    const job = new TestJob()
    expect(job).toBeInstanceOf(RedwoodJob)
  })

  it('can set options for the job', () => {
    const job = new TestJob({ wait: 5 })
    expect(job.options.wait).toEqual(5)
  })

  it('throws an error if no adapter is configured', async () => {
    // @ts-expect-error - testing JS scenario
    class AdapterlessJob extends RedwoodJob {
      static adapter = undefined
    }

    expect(() => new AdapterlessJob()).toThrow(errors.AdapterNotConfiguredError)
  })
})

describe('static set()', () => {
  it('returns a job instance', () => {
    const job = TestJob.set({ wait: 300 })

    expect(job).toBeInstanceOf(TestJob)
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
    const job = new TestJob().set()

    expect(job).toBeInstanceOf(TestJob)
  })

  it('sets options for the job', () => {
    const job = new TestJob().set({ queue: 'foo', priority: 10, wait: 300 })

    expect(job.options).toEqual({ queue: 'foo', priority: 10, wait: 300 })
  })

  it('overrides initialization options', () => {
    const job = new TestJob({ queue: 'foo' })
    job.set({ queue: 'bar' })

    expect(job.queue).toEqual('bar')
  })

  it('does not override different options', () => {
    const job = new TestJob({ priority: 10 })
    job.set({ queue: 'foo' })

    expect(job.priority).toEqual(10)
    expect(job.queue).toEqual('foo')
  })

  it('can override the static (class) queue', () => {
    const job = new TestJob()
    expect(job.queue).toEqual(DEFAULT_QUEUE)

    job.set({ queue: 'random' })
    expect(job.options.queue).toEqual('random')
  })

  it('can override the static (class) priority', () => {
    const job = new TestJob()
    expect(job.priority).toEqual(DEFAULT_PRIORITY)

    job.set({ priority: 10 })
    expect(job.options.priority).toEqual(10)
  })
})

describe('get options()', () => {
  it('returns the options set in the class', () => {
    const job = new TestJob({ queue: 'foo' })

    expect(job.options).toEqual({ queue: 'foo' })
  })
})

describe('get adapter()', () => {
  it('returns the adapter set in the class', () => {
    const job = new TestJob()

    expect(job.adapter).toEqual(mockAdapter)
  })
})

describe('get logger()', () => {
  it('returns the logger set in the class', () => {
    const job = new TestJob()

    expect(job.logger).toEqual(mockLogger)
  })
})

describe('get queue()', () => {
  it('returns the queue set in the class if no option set', () => {
    const job = new TestJob()

    expect(job.queue).toEqual(DEFAULT_QUEUE)
  })

  it('returns the queue set in the options', () => {
    const job = new TestJob({ queue: 'foo' })

    expect(job.queue).toEqual('foo')
  })
})

describe('get priority()', () => {
  it('returns the priority set in the class if no option set', () => {
    const job = new TestJob()

    expect(job.priority).toEqual(DEFAULT_PRIORITY)
  })

  it('returns the priority set in the options', () => {
    const job = new TestJob({ priority: 10 })

    expect(job.priority).toEqual(10)
  })
})

describe('get wait()', () => {
  it('returns the wait set in the options', () => {
    const job = new TestJob({ wait: 10 })

    expect(job.wait).toEqual(10)
  })
})

describe('get waitUntil()', () => {
  it('returns the waitUntil set in the options', () => {
    const futureDate = new Date(2025, 0, 1)
    const job = new TestJob({ waitUntil: futureDate })

    expect(job.waitUntil).toEqual(futureDate)
  })
})

describe('get runAt()', () => {
  it('returns the current time if no options are set', () => {
    const job = new TestJob()

    expect(job.runAt).toEqual(new Date())
  })

  it('returns a datetime `wait` seconds in the future if option set', async () => {
    const job = new TestJob().set({ wait: 300 })

    const nowPlus300s = new Date(FAKE_NOW.getTime() + 300 * 1000)
    expect(job.runAt).toEqual(nowPlus300s)
  })

  it('returns a datetime set to `waitUntil` if option set', async () => {
    const futureDate = new Date(2030, 1, 2, 12, 34, 56)
    const job = new TestJob().set({
      waitUntil: futureDate,
    })

    expect(job.runAt).toEqual(futureDate)
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
