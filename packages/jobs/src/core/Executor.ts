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
  job: any
  logger?: BasicLogger
}

export class Executor {
  options: Options
  adapter: BaseAdapter
  job: any | null
  logger: BasicLogger

  constructor(options: Options) {
    this.options = options
    this.adapter = options.adapter
    this.job = options.job
    this.logger = options.logger || console

    // validate that everything we need is available
    if (!this.adapter) {
      throw new AdapterRequiredError()
    }
    if (!this.job) {
      throw new JobRequiredError()
    }
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
      return this.adapter.failure(this.job, error)
    }
  }
}
