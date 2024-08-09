import console from 'node:console'

import { beforeEach, describe, expect, vi, it } from 'vitest'

import * as errors from '../../errors'
import { loadJob } from '../../loaders'
import { Executor } from '../Executor'

// so that registerApiSideBabelHook() doesn't freak out about redwood.toml
vi.mock('@redwoodjs/babel-config')

vi.mock('@redwoodjs/cli-helpers', async (importOriginal) => {
  const originalCliHelpers = await importOriginal()

  return {
    ...originalCliHelpers,
    isTypeScriptProject: () => false,
  }
})

const mocks = vi.hoisted(() => {
  return {
    loadJob: vi.fn(),
  }
})

vi.mock('../../loaders', () => {
  return {
    loadJob: mocks.loadJob,
  }
})

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('constructor', () => {
  it('saves options', () => {
    const options = { adapter: 'adapter', job: 'job' }
    const exector = new Executor(options)

    expect(exector.options).toEqual(expect.objectContaining(options))
  })

  it('extracts adapter from options to variable', () => {
    const options = { adapter: 'adapter', job: 'job' }
    const exector = new Executor(options)

    expect(exector.adapter).toEqual('adapter')
  })

  it('extracts job from options to variable', () => {
    const options = { adapter: 'adapter', job: 'job' }
    const exector = new Executor(options)

    expect(exector.job).toEqual('job')
  })

  it('extracts logger from options to variable', () => {
    const options = { adapter: 'adapter', job: 'job', logger: { foo: 'bar' } }
    const exector = new Executor(options)

    expect(exector.logger).toEqual({ foo: 'bar' })
  })

  it('defaults logger if not provided', () => {
    const options = { adapter: 'adapter', job: 'job' }
    const exector = new Executor(options)

    expect(exector.logger).toEqual(console)
  })

  it('throws AdapterRequiredError if adapter is not provided', () => {
    const options = { job: 'job' }

    expect(() => new Executor(options)).toThrow(errors.AdapterRequiredError)
  })

  it('throws JobRequiredError if job is not provided', () => {
    const options = { adapter: 'adapter' }

    expect(() => new Executor(options)).toThrow(errors.JobRequiredError)
  })
})

describe('perform', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // TODO once these dynamic imports are converted into loadJob in shared, just mock out the result of loadJob
  it('invokes the `perform` method on the job class', async () => {
    const mockAdapter = { success: vi.fn() }
    const options = {
      adapter: mockAdapter,
      logger: mockLogger,
      job: { id: 1, name: 'TestJob', path: 'TestJob/TestJob', args: ['foo'] },
    }
    const executor = new Executor(options)
    const job = { id: 1 }

    // mock the job
    const mockJob = { perform: vi.fn() }
    // spy on the perform method
    const performSpy = vi.spyOn(mockJob, 'perform')
    // mock the `loadJob` loader to return the job mock
    mocks.loadJob.mockImplementation(() => mockJob)

    await executor.perform(job)

    expect(performSpy).toHaveBeenCalledWith('foo')
  })

  it('invokes the `success` method on the adapter when job successful', async () => {
    const mockAdapter = { success: vi.fn() }
    const options = {
      adapter: mockAdapter,
      logger: mockLogger,
      job: { id: 1, name: 'TestJob', path: 'TestJob/TestJob', args: ['foo'] },
    }
    const executor = new Executor(options)
    const job = { id: 1 }

    // mock the job
    const mockJob = { perform: vi.fn() }
    // spy on the success function of the adapter
    const adapterSpy = vi.spyOn(mockAdapter, 'success')
    // mock the `loadJob` loader to return the job mock
    mocks.loadJob.mockImplementation(() => mockJob)

    await executor.perform(job)

    expect(adapterSpy).toHaveBeenCalledWith({
      job: options.job,
      deleteJob: true,
    })
  })

  it('invokes the `failure` method on the adapter when job fails', async () => {
    const mockAdapter = { error: vi.fn() }
    const options = {
      adapter: mockAdapter,
      logger: mockLogger,
      job: {
        id: 1,
        name: 'TestJob',
        path: 'TestJob/TestJob',
        args: ['foo'],
        attempts: 0,
      },
    }
    const executor = new Executor(options)
    const job = { id: 1 }

    const error = new Error()
    // mock the job
    const mockJob = {
      perform: vi.fn(() => {
        throw error
      }),
    }
    // spy on the success function of the adapter
    const adapterSpy = vi.spyOn(mockAdapter, 'error')
    // mock the `loadJob` loader to return the job mock
    mocks.loadJob.mockImplementation(() => mockJob)

    await executor.perform(job)

    expect(adapterSpy).toHaveBeenCalledWith({
      job: options.job,
      error,
    })
  })
})
