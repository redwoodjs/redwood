// Used by the job runner to find the next job to run and invoke the Executor

import { setTimeout } from 'node:timers'

import type { BaseAdapter } from '../adapters/BaseAdapter'
import { AdapterRequiredError } from '../errors'
import type { BasicLogger } from '../types'

import { Executor } from './Executor'

interface WorkerConfig {
  adapter: BaseAdapter
  logger: BasicLogger
  clear: boolean
  processName: string
  queues: string[]
  maxAttempts: number
  maxRuntime: number
  deleteFailedJobs: boolean
  sleepDelay: number
  workoff: boolean
}

export class Worker {
  options: WorkerConfig
  adapter: BaseAdapter
  logger: BasicLogger
  clear: boolean
  processName: string
  queues: string[]
  maxAttempts: number
  maxRuntime: number
  deleteFailedJobs: boolean
  sleepDelay: number
  lastCheckTime: Date
  forever: boolean
  workoff: boolean

  constructor(options: WorkerConfig) {
    this.options = options

    if (!options?.adapter) {
      throw new AdapterRequiredError()
    }

    this.adapter = this.options.adapter
    this.logger = this.options.logger

    // if true, will clear the queue of all jobs and then exit
    this.clear = this.options.clear

    // used to set the `lockedBy` field in the database
    this.processName = this.options.processName

    // if not given a queue name then will work on jobs in any queue
    this.queues = this.options.queues

    // the maximum number of times to retry a failed job
    this.maxAttempts = this.options.maxAttempts

    // the maximum amount of time to let a job run
    this.maxRuntime = this.options.maxRuntime

    // whether to keep failed jobs in the database after reaching maxAttempts
    // `undefined` check needed here so we can explicitly set to `false`
    this.deleteFailedJobs = this.options.deleteFailedJobs

    // the amount of time to wait in milliseconds between checking for jobs.
    // the time it took to run a job is subtracted from this time, so this is a
    // maximum wait time. Do an `undefined` check here so we can set to 0
    this.sleepDelay = this.options.sleepDelay * 1000

    // Set to `false` and the work loop will quit when the current job is done
    // running (regardless of how many outstanding jobs there are to be worked
    // on). The worker process will set this to `false` as soon as the user hits
    // ctrl-c so any current job will complete before exiting.
    this.forever = true

    // Set to `true` if the work loop should run through all *available* jobs
    // and then quit. Serves a slightly different purpose than `forever` which
    // makes the runner exit immediately after the next loop, where as `workoff`
    // doesn't exit the loop until there are no more jobs to work on.
    this.workoff = this.options.workoff

    // keep track of the last time we checked for jobs
    this.lastCheckTime = new Date()
  }

  // Workers run forever unless:
  // `this.forever` to false (loop only runs once, then exits)
  // `this.workoff` is true (run all jobs in the queue, then exits)
  run() {
    if (this.clear) {
      return this.#clearQueue()
    } else {
      return this.#work()
    }
  }

  get queueNames() {
    if (this.queues.length === 1 && this.queues[0] === '*') {
      return 'all (*)'
    } else {
      return this.queues.join(', ')
    }
  }

  async #clearQueue() {
    return await this.adapter.clear()
  }

  async #work() {
    do {
      this.lastCheckTime = new Date()

      this.logger.debug(
        `[${this.processName}] Checking for jobs in ${this.queueNames} queues...`,
      )

      const job = await this.adapter.find({
        processName: this.processName,
        maxRuntime: this.maxRuntime,
        queues: this.queues,
      })

      if (job) {
        // TODO add timeout handling if runs for more than `this.maxRuntime`
        await new Executor({
          adapter: this.adapter,
          logger: this.logger,
          job,
          maxAttempts: this.maxAttempts,
          deleteFailedJobs: this.deleteFailedJobs,
        }).perform()
      } else if (this.workoff) {
        // If there are no jobs and we're in workoff mode, we're done
        break
      }

      // sleep if there were no jobs found, otherwise get back to work
      if (!job && this.forever) {
        const millsSinceLastCheck =
          new Date().getTime() - this.lastCheckTime.getTime()
        if (millsSinceLastCheck < this.sleepDelay) {
          await this.#wait(this.sleepDelay - millsSinceLastCheck)
        }
      }
    } while (this.forever)
  }

  #wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
