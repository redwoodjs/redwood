import console from 'node:console'

import {
  describe,
  expect,
  vi,
  it,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'

import * as errors from '../../errors'
import { Executor } from '../Executor'
import { Worker, DEFAULTS } from '../Worker'

// don't execute any code inside Executor, just spy on whether functions are
// called
vi.mock('../Executor')

// so that registerApiSideBabelHook() doesn't freak out about redwood.toml
vi.mock('@redwoodjs/babel-config')

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => false,
  }
})

// vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('constructor', () => {
  it('saves options', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.options.adapter).toEqual(options.adapter)
  })

  it('extracts adapter from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.adapter).toEqual('adapter')
  })

  it('extracts logger from options to variable', () => {
    const options = {
      adapter: 'adapter',
      queues: ['*'],
      logger: { foo: 'bar' },
    }
    const worker = new Worker(options)

    expect(worker.logger).toEqual({ foo: 'bar' })
  })

  it('defaults logger if not provided', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.logger).toEqual(console)
  })

  it('extracts processName from options to variable', () => {
    const options = {
      adapter: 'adapter',
      queues: ['*'],
      processName: 'processName',
    }
    const worker = new Worker(options)

    expect(worker.processName).toEqual('processName')
  })

  it('extracts queue from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['default'] }
    const worker = new Worker(options)

    expect(worker.queues).toEqual(['default'])
  })

  it('extracts clear from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], clear: true }
    const worker = new Worker(options)

    expect(worker.clear).toEqual(true)
  })

  it('defaults clear if not provided', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.clear).toEqual(false)
  })

  it('extracts maxAttempts from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], maxAttempts: 10 }
    const worker = new Worker(options)

    expect(worker.maxAttempts).toEqual(10)
  })

  it('extracts maxRuntime from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], maxRuntime: 10 }
    const worker = new Worker(options)

    expect(worker.maxRuntime).toEqual(10)
  })

  it('extracts deleteFailedJobs from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], deleteFailedJobs: 10 }
    const worker = new Worker(options)

    expect(worker.deleteFailedJobs).toEqual(10)
  })

  it('extracts sleepDelay from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], sleepDelay: 5 }
    const worker = new Worker(options)

    expect(worker.sleepDelay).toEqual(5000)
  })

  it('can set sleepDelay to 0', () => {
    const options = { adapter: 'adapter', queues: ['*'], sleepDelay: 0 }
    const worker = new Worker(options)

    expect(worker.sleepDelay).toEqual(0)
  })

  it('sets forever', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.forever).toEqual(true)
  })

  it('extracts workoff from options to variable', () => {
    const options = { adapter: 'adapter', queues: ['*'], workoff: true }
    const worker = new Worker(options)

    expect(worker.workoff).toEqual(true)
  })

  it('defaults workoff if not provided', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.workoff).toEqual(false)
  })

  it('sets lastCheckTime to the current time', () => {
    const options = { adapter: 'adapter', queues: ['*'] }
    const worker = new Worker(options)

    expect(worker.lastCheckTime).toBeInstanceOf(Date)
  })

  it('throws an error if adapter not set', () => {
    expect(() => new Worker()).toThrow(errors.AdapterRequiredError)
  })

  it('throws an error if queues not set', () => {
    expect(() => new Worker()).toThrow(errors.AdapterRequiredError)
  })

  it('throws an error if queues is an empty array', () => {
    expect(() => new Worker()).toThrow(errors.AdapterRequiredError)
  })
})

describe('run', async () => {
  it('tries to find a job', async () => {
    const adapter = { find: vi.fn(() => null) }
    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      forever: false,
    })

    await worker.run()

    expect(adapter.find).toHaveBeenCalledWith({
      processName: worker.processName,
      maxRuntime: worker.maxRuntime,
      queues: worker.queues,
    })
  })

  it('will try to find jobs in a loop until `forever` is set to `false`', async () => {
    const adapter = { find: vi.fn(() => null) }
    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0.01,
      forever: true,
    })

    worker.run()
    // just enough delay to run through the loop twice
    await new Promise((resolve) => setTimeout(resolve, 20))
    worker.forever = false
    expect(adapter.find).toHaveBeenCalledTimes(2)
  })

  it('does nothing if no job found and forever=false', async () => {
    const adapter = { find: vi.fn(() => null) }
    vi.spyOn(Executor, 'constructor')

    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      forever: false,
    })
    await worker.run()

    expect(Executor).not.toHaveBeenCalled()
  })

  it('exits if no job found and workoff=true', async () => {
    const adapter = { find: vi.fn(() => null) }
    vi.spyOn(Executor, 'constructor')

    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      workoff: true,
    })
    await worker.run()

    expect(Executor).not.toHaveBeenCalled()
  })

  it('loops until no job found when workoff=true', async () => {
    const adapter = {
      find: vi
        .fn()
        .mockImplementationOnce(() => ({ id: 1 }))
        .mockImplementationOnce(() => null),
    }
    vi.spyOn(Executor, 'constructor')

    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      workoff: true,
    })
    await worker.run()

    expect(Executor).toHaveBeenCalledOnce()
  })

  it('initializes an Executor instance if the job is found', async () => {
    const adapter = { find: vi.fn(() => ({ id: 1 })) }
    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      forever: false,
      maxAttempts: 10,
      deleteSuccessfulJobs: false,
      deleteFailedJobs: true,
    })

    await worker.run()

    expect(Executor).toHaveBeenCalledWith({
      adapter,
      job: { id: 1 },
      logger: worker.logger,
      maxAttempts: 10,
      deleteSuccessfulJobs: false,
      deleteFailedJobs: true,
    })
  })

  it('calls `perform` on the Executor instance', async () => {
    const adapter = { find: vi.fn(() => ({ id: 1 })) }
    const spy = vi.spyOn(Executor.prototype, 'perform')
    const worker = new Worker({
      adapter,
      queues: ['*'],
      sleepDelay: 0,
      forever: false,
    })

    await worker.run()

    expect(spy).toHaveBeenCalled()
  })
})
