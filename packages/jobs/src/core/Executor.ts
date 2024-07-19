// Used by the job runner to execute a job and track success or failure

import console from 'node:console'

import type { BaseAdapter } from '../adapters/BaseAdapter'
import type { BasicLogger } from '../types'

import {
  AdapterRequiredError,
  JobRequiredError,
  JobExportNotFoundError,
} from './errors'
import { loadJob } from './loaders'

interface Options {
  adapter: BaseAdapter
  logger?: BasicLogger
  job: any
  maxAttempts: number
  deleteFailedJobs: boolean
}

export class Executor {
  options: Options
  adapter: BaseAdapter
  logger: BasicLogger
  job: any | null
  maxAttempts: number
  deleteFailedJobs: boolean

  constructor(options: Options) {
    this.options = options

    // validate that everything we need is available
    if (!options.adapter) {
      throw new AdapterRequiredError()
    }
    if (!options.job) {
      throw new JobRequiredError()
    }

    this.adapter = options.adapter
    this.logger = options.logger || console
    this.job = options.job
    this.maxAttempts = options.maxAttempts
    this.deleteFailedJobs = options.deleteFailedJobs
  }

  async perform() {
    this.logger.info(this.job, `Started job ${this.job.id}`)
    const details = JSON.parse(this.job.handler)

    try {
      const jobModule = await loadJob(details.handler)
      await new jobModule[details.handler]().perform(...details.args)
      return this.adapter.success(this.job)
    } catch (e: any) {
      let error = e
      if (e.message.match(/is not a constructor/)) {
        error = new JobExportNotFoundError(details.handler)
      }
      this.logger.error(error.stack)
      return this.adapter.failure(this.job, error, {
        maxAttempts: this.maxAttempts,
        deleteFailedJobs: this.deleteFailedJobs,
      })
    }
  }
}
