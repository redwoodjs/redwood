import { idText } from 'typescript'
import { describe, expect, vi, it } from 'vitest'

import type CliHelpers from '@redwoodjs/cli-helpers'

import { createScheduler } from '../createScheduler'
import { Scheduler } from '../Scheduler'

import { mockAdapter } from './mocks'

vi.mock('../Scheduler')

describe('createScheduler', () => {
  it('returns a function', () => {
    const scheduler = createScheduler({
      adapter: mockAdapter,
    })

    expect(scheduler).toBeInstanceOf(Function)
  })

  it('creates an instance of the JobScheduler when the resulting function is called', () => {
    const config = { adapter: mockAdapter }
    const job = () => {}
    const jobArgs = ['foo']
    const jobOptions = { wait: 300 }
    const scheduler = createScheduler(config)

    scheduler(job, jobArgs, jobOptions)

    expect(Scheduler).toHaveBeenCalledWith({
      config,
      job,
      jobArgs,
      jobOptions,
    })
  })

  it('calls the `schedule` method on the JobScheduler instance', () => {
    const config = { adapter: mockAdapter }
    const job = () => {}
    const jobArgs = ['foo']
    const jobOptions = { wait: 300 }
    const scheduler = createScheduler(config)
    const spy = vi.spyOn(Scheduler.prototype, 'schedule')

    scheduler(job, jobArgs, jobOptions)

    expect(spy).toHaveBeenCalled()
  })
})
