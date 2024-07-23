import console from 'node:console'

import { describe, expect, vi, it } from 'vitest'

import * as errors from '../../core/errors'
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
  // TODO once these dynamic imports are converted into loadJob in shared, just mock out the result of loadJob
  it.skip('invokes the `perform` method on the job class', async () => {
    const options = {
      adapter: 'adapter',
      job: { handler: JSON.stringify({ handler: 'Foo', args: ['bar'] }) },
    }
    const executor = new Executor(options)
    const job = { id: 1 }

    const mockJob = vi.fn(() => {
      return { perform: vi.fn() }
    })
    vi.mock(`../Foo`, () => ({ Foo: mockJob }), { virtual: true })

    await executor.perform(job)

    expect(mockJob).toHaveBeenCalledWith('bar')
  })

  it.skip('invokes the `success` method on the adapter when job successful', async () => {})

  it.skip('invokes the `failure` method on the adapter when job fails', async () => {})
})
