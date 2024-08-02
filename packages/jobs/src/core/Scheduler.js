import {
  DEFAULT_LOGGER,
  DEFAULT_PRIORITY,
  DEFAULT_WAIT,
  DEFAULT_WAIT_UNTIL,
} from './consts'
import {
  AdapterNotConfiguredError,
  QueueNotConfiguredError,
  SchedulingError,
} from './errors'

export class Scheduler {
  constructor({ config, adapter, logger }) {
    this.config = config
    this.logger = logger ?? DEFAULT_LOGGER
    this.adapter = adapter

    if (!this.adapter) {
      throw new AdapterNotConfiguredError()
    }
  }

  computeRunAt(wait, waitUntil) {
    if (wait && wait > 0) {
      return new Date(new Date().getTime() + wait * 1000)
    } else if (waitUntil) {
      return waitUntil
    } else {
      return new Date()
    }
  }

  buildPayload(job, args, options) {
    const queue = options.queue ?? job.queue ?? this.config.queue
    const priority =
      options.priority ??
      job.priority ??
      this.config.priority ??
      DEFAULT_PRIORITY
    const wait = options.wait ?? job.wait ?? DEFAULT_WAIT
    const waitUntil = options.waitUntil ?? job.waitUntil ?? DEFAULT_WAIT_UNTIL

    if (!queue) {
      throw new QueueNotConfiguredError()
    }

    return {
      job: job.name,
      args: args,
      runAt: this.computeRunAt(wait, waitUntil),
      queue: queue,
      priority: priority,
    }
  }

  async schedule({ job, jobArgs = [], jobOptions = {} } = {}) {
    const payload = this.buildPayload(job, jobArgs, jobOptions)

    this.logger.info(
      payload,
      `[RedwoodJob] Scheduling ${this.constructor.name}`,
    )

    try {
      this.adapter.schedule(payload)
      return true
    } catch (e) {
      throw new SchedulingError(
        `[RedwoodJob] Exception when scheduling ${payload.name}`,
        e,
      )
    }
  }
}
