// Used by the job runner to execute a job and track success or failure

import console from 'node:console'

import {
  AdapterRequiredError,
  JobRequiredError,
  JobExportNotFoundError,
} from './errors'
import { loadJob } from './loaders'

export class Executor {
  constructor(options) {
    this.options = options
    this.adapter = options?.adapter
    this.job = options?.job
    this.logger = options?.logger || console

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
    } catch (e) {
      let error = e
      if (e.message.match(/is not a constructor/)) {
        error = new JobExportNotFoundError(details.handler)
      }
      this.logger.error(error.stack)
      return this.adapter.failure(this.job, error)
    }
  }
}
