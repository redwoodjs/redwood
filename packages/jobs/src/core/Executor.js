// Used by the job runner to execute a job and track success or failure

import fg from 'fast-glob'

import {
  AdapterRequiredError,
  JobRequiredError,
  JobNotFoundError,
} from './errors'

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

    try {
      const details = JSON.parse(this.job.handler)
      const entries = await fg(`./**/${details.handler}.js`, { cwd: __dirname })
      if (!entries[0]) {
        throw new JobNotFoundError(details.handler)
      }

      const Job = await import(`./${entries[0]}`)
      await new Job[details.handler]().perform(...details.args)

      return this.adapter.success(this.job)
    } catch (e) {
      this.logger.error(e.stack)
      return this.adapter.failure(this.job, e)
    }
  }
}
