// Used by the job runner to execute a job and track success or failure

import console from 'node:console'

import type { BaseAdapter } from '../adapters/BaseAdapter'
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_DELETE_FAILED_JOBS,
  DEFAULT_DELETE_SUCCESSFUL_JOBS,
} from '../consts'
import { AdapterRequiredError, JobRequiredError } from '../errors'
import { loadJob } from '../loaders'
import type { BasicLogger } from '../types'

interface Options {
  adapter: BaseAdapter
  job: any
  logger?: BasicLogger
  maxAttempts?: number
  deleteFailedJobs?: boolean
  deleteSuccessfulJobs?: boolean
}

interface DefaultOptions {
  logger: BasicLogger
  maxAttempts: number
  deleteFailedJobs: boolean
  deleteSuccessfulJobs: boolean
}

type CompleteOptions = Options & DefaultOptions

export const DEFAULTS: DefaultOptions = {
  logger: console,
  maxAttempts: DEFAULT_MAX_ATTEMPTS,
  deleteFailedJobs: DEFAULT_DELETE_FAILED_JOBS,
  deleteSuccessfulJobs: DEFAULT_DELETE_SUCCESSFUL_JOBS,
}

export class Executor {
  options: CompleteOptions
  adapter: BaseAdapter
  logger: BasicLogger
  job: any | null
  maxAttempts: number
  deleteFailedJobs: boolean
  deleteSuccessfulJobs: boolean

  constructor(options: Options) {
    this.options = { ...DEFAULTS, ...options }

    // validate that everything we need is available
    if (!this.options.adapter) {
      throw new AdapterRequiredError()
    }
    if (!this.options.job) {
      throw new JobRequiredError()
    }

    this.adapter = this.options.adapter
    this.logger = this.options.logger
    this.job = this.options.job
    this.maxAttempts = this.options.maxAttempts
    this.deleteFailedJobs = this.options.deleteFailedJobs
    this.deleteSuccessfulJobs = this.options.deleteSuccessfulJobs
  }

  async perform() {
    this.logger.info(`Started job ${this.job.id}`)

    // TODO break these lines down into individual try/catch blocks?
    try {
      const job = loadJob({ name: this.job.name, path: this.job.path })
      await job.perform(...this.job.args)

      // TODO(@rob): Ask Josh about why this would "have no effect"?
      await this.adapter.success({
        job: this.job,
        deleteJob: DEFAULT_DELETE_SUCCESSFUL_JOBS,
      })
    } catch (error: any) {
      this.logger.error(`Error in job ${this.job.id}: ${error.message}`)
      this.logger.error(error.stack)

      await this.adapter.error({
        job: this.job,
        error,
      })

      if (this.job.attempts >= this.maxAttempts) {
        this.logger.warn(
          this.job,
          `Failed job ${this.job.id}: reached max attempts (${this.maxAttempts})`,
        )
        await this.adapter.failure({
          job: this.job,
          deleteJob: this.deleteFailedJobs,
        })
      }
    }
  }
}
