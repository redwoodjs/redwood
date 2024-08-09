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

import * as errors from '../../core/errors'
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

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

describe('constructor', () => {
  it('saves options', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.options.adapter).toEqual(options.adapter)
  })

  it('extracts adapter from options to variable', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.adapter).toEqual('adapter')
  })

  it('extracts logger from options to variable', () => {
    const options = { adapter: 'adapter', logger: { foo: 'bar' } }
    const worker = new Worker(options)

    expect(worker.logger).toEqual({ foo: 'bar' })
  })

  it('defaults logger if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.logger).toEqual(console)
  })

  it('extracts processName from options to variable', () => {
    const options = { adapter: 'adapter', processName: 'processName' }
    const worker = new Worker(options)

    expect(worker.processName).toEqual('processName')
  })

  it('defaults processName if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.processName).not.toBeUndefined()
  })

  it('extracts queue from options to variable', () => {
    const options = { adapter: 'adapter', queue: 'queue' }
    const worker = new Worker(options)

    expect(worker.queue).toEqual('queue')
  })

  it('defaults queue if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.queue).toBeNull()
  })

  it('extracts clear from options to variable', () => {
    const options = { adapter: 'adapter', clear: true }
    const worker = new Worker(options)

    expect(worker.clear).toEqual(true)
  })

  it('defaults clear if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.clear).toEqual(false)
  })

  it('extracts maxAttempts from options to variable', () => {
    const options = { adapter: 'adapter', maxAttempts: 10 }
    const worker = new Worker(options)

    expect(worker.maxAttempts).toEqual(10)
  })

  it('defaults maxAttempts if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.maxAttempts).toEqual(DEFAULTS.maxAttempts)
  })

  it('extracts maxRuntime from options to variable', () => {
    const options = { adapter: 'adapter', maxRuntime: 10 }
    const worker = new Worker(options)

    expect(worker.maxRuntime).toEqual(10)
  })

  it('defaults maxRuntime if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.maxRuntime).toEqual(DEFAULTS.maxRuntime)
  })

  it('extracts deleteFailedJobs from options to variable', () => {
    const options = { adapter: 'adapter', deleteFailedJobs: 10 }
    const worker = new Worker(options)

    expect(worker.deleteFailedJobs).toEqual(10)
  })

  it('defaults deleteFailedJobs if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.deleteFailedJobs).toEqual(DEFAULTS.deleteFailedJobs)
  })

  it('extracts sleepDelay from options to variable', () => {
    const options = { adapter: 'adapter', sleepDelay: 5 }
    const worker = new Worker(options)

    expect(worker.sleepDelay).toEqual(5000)
  })

  it('defaults sleepDelay if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.sleepDelay).toEqual(DEFAULTS.sleepDelay * 1000)
  })

  it('can set sleepDelay to 0', () => {
    const options = { adapter: 'adapter', sleepDelay: 0 }
    const worker = new Worker(options)

    expect(worker.sleepDelay).toEqual(0)
  })

  it('extracts forever from options to variable', () => {
    const options = { adapter: 'adapter', forever: false }
    const worker = new Worker(options)

    expect(worker.forever).toEqual(false)
  })

  it('defaults forever if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.forever).toEqual(true)
  })

  it('extracts workoff from options to variable', () => {
    const options = { adapter: 'adapter', workoff: true }
    const worker = new Worker(options)

    expect(worker.workoff).toEqual(true)
  })

  it('defaults workoff if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.workoff).toEqual(false)
  })

  it('sets lastCheckTime to the current time', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.lastCheckTime).toBeInstanceOf(Date)
  })

  it('extracts forever from options to variable', () => {
    const options = { adapter: 'adapter', forever: false }
    const worker = new Worker(options)

    expect(worker.forever).toEqual(false)
  })

  it('defaults forever if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.forever).toEqual(true)
  })

  it('throws an error if adapter not set', () => {
    expect(() => new Worker()).toThrow(errors.AdapterRequiredError)
  })
})

const originalConsoleDebug = console.debug

describe('run', () => {
  beforeAll(() => {
    // hide console.debug output during test run
    console.debug = vi.fn()
  })

  afterEach(() => {
    // vi.resetAllMocks()
  })

  afterAll(() => {
    // reenable console.debug output during test run
    console.debug = originalConsoleDebug
  })

  it('tries to find a job', async () => {
    const adapter = { find: vi.fn(() => null) }
    const worker = new Worker({ adapter, waitTime: 0, forever: false })

    await worker.run()

    expect(adapter.find).toHaveBeenCalledWith({
      processName: worker.processName,
      maxRuntime: worker.maxRuntime,
      queue: worker.queue,
    })
  })

  it('does nothing if no job found and forever=false', async () => {
    const adapter = { find: vi.fn(() => null) }
    vi.spyOn(Executor, 'constructor')

    const worker = new Worker({ adapter, waitTime: 0, forever: false })
    await worker.run()

    expect(Executor).not.toHaveBeenCalled()
  })

  it('does nothing if no job found and workoff=true', async () => {
    const adapter = { find: vi.fn(() => null) }
    vi.spyOn(Executor, 'constructor')

    const worker = new Worker({ adapter, waitTime: 0, workoff: true })
    await worker.run()

    expect(Executor).not.toHaveBeenCalled()
  })

  it('initializes an Executor instance if the job is found', async () => {
    const adapter = { find: vi.fn(() => ({ id: 1 })) }
    const worker = new Worker({
      adapter,
      waitTime: 0,
      forever: false,
      maxAttempts: 10,
      deleteFailedJobs: true,
    })

    await worker.run()

    expect(Executor).toHaveBeenCalledWith({
      adapter,
      job: { id: 1 },
      logger: worker.logger,
      maxAttempts: 10,
      deleteFailedJobs: true,
    })
  })

  it('calls `perform` on the Executor instance', async () => {
    const adapter = { find: vi.fn(() => ({ id: 1 })) }
    const spy = vi.spyOn(Executor.prototype, 'perform')
    const worker = new Worker({ adapter, waitTime: 0, forever: false })

    await worker.run()

    expect(spy).toHaveBeenCalled()
  })

  it('calls `perform` on the Executor instance', async () => {
    const adapter = { find: vi.fn(() => ({ id: 1 })) }
    const spy = vi.spyOn(Executor.prototype, 'perform')
    const worker = new Worker({ adapter, waitTime: 0, forever: false })

    await worker.run()

    expect(spy).toHaveBeenCalled()
  })
})
