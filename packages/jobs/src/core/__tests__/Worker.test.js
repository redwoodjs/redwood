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
import { Worker, DEFAULT_MAX_RUNTIME, DEFAULT_WAIT_TIME } from '../Worker'

// don't execute any code inside Executor, just spy on whether functions are
// called
vi.mock('../Executor')

// so that registerApiSideBabelHook() doesn't freak out about redwood.toml
vi.mock('@redwoodjs/babel-config')

vi.useFakeTimers().setSystemTime(new Date('2024-01-01'))

describe('constructor', () => {
  it('saves options', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.options).toEqual(options)
  })

  it('extracts adapter from options to variable', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.adapter).toEqual('adapter')
  })

  it('extracts queue from options to variable', () => {
    const options = { adapter: 'adapter', queue: 'queue' }
    const worker = new Worker(options)

    expect(worker.queue).toEqual('queue')
  })

  it('queue will be null if no queue specified', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.queue).toBeNull()
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

  it('extracts maxRuntime from options to variable', () => {
    const options = { adapter: 'adapter', maxRuntime: 1000 }
    const worker = new Worker(options)

    expect(worker.maxRuntime).toEqual(1000)
  })

  it('sets default maxRuntime if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.maxRuntime).toEqual(DEFAULT_MAX_RUNTIME)
  })

  it('extracts waitTime from options to variable', () => {
    const options = { adapter: 'adapter', waitTime: 1000 }
    const worker = new Worker(options)

    expect(worker.waitTime).toEqual(1000)
  })

  it('sets default waitTime if not provided', () => {
    const options = { adapter: 'adapter' }
    const worker = new Worker(options)

    expect(worker.waitTime).toEqual(DEFAULT_WAIT_TIME)
  })

  it('can set waitTime to 0', () => {
    const options = { adapter: 'adapter', waitTime: 0 }
    const worker = new Worker(options)

    expect(worker.waitTime).toEqual(0)
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

  it('sets forever to `true` by default', () => {
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
    const worker = new Worker({ adapter, waitTime: 0, forever: false })

    await worker.run()

    expect(Executor).toHaveBeenCalledWith({
      adapter,
      job: { id: 1 },
      logger: worker.logger,
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
