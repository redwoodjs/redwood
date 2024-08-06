import type { BaseAdapter, SchedulePayload } from '../adapters/BaseAdapter'
import {
  DEFAULT_LOGGER,
  DEFAULT_PRIORITY,
  DEFAULT_WAIT,
  DEFAULT_WAIT_UNTIL,
} from '../consts'
import {
  AdapterNotConfiguredError,
  QueueNotDefinedError,
  SchedulingError,
} from '../errors'
import type { BasicLogger, Job, ScheduleJobOptions } from '../types'

interface SchedulerConfig<TAdapter extends BaseAdapter> {
  adapter: TAdapter
  logger?: BasicLogger
}

export class Scheduler<TAdapter extends BaseAdapter> {
  adapter: TAdapter
  logger: BasicLogger

  constructor({ adapter, logger }: SchedulerConfig<TAdapter>) {
    this.logger = logger ?? DEFAULT_LOGGER
    this.adapter = adapter

    if (!this.adapter) {
      throw new AdapterNotConfiguredError()
    }
  }

  computeRunAt(wait: number, waitUntil: Date | null) {
    if (wait && wait > 0) {
      return new Date(new Date().getTime() + wait * 1000)
    } else if (waitUntil) {
      return waitUntil
    } else {
      return new Date()
    }
  }

  buildPayload<T extends Job<string[], unknown[]>>(
    job: T,
    args?: Parameters<T['perform']>,
    options?: ScheduleJobOptions,
  ): SchedulePayload {
    const queue = job.queue
    const priority = job.priority ?? DEFAULT_PRIORITY
    const wait = options?.wait ?? DEFAULT_WAIT
    const waitUntil = options?.waitUntil ?? DEFAULT_WAIT_UNTIL

    if (!queue) {
      throw new QueueNotDefinedError()
    }

    return {
      // @ts-expect-error(jgmw): Fix this
      job: job.name as string,
      args: args ?? [],
      runAt: this.computeRunAt(wait, waitUntil),
      queue: queue,
      priority: priority,
    }
  }

  async schedule<T extends Job<string[], unknown[]>>({
    job,
    jobArgs,
    jobOptions,
  }: {
    job: T
    jobArgs?: Parameters<T['perform']>
    jobOptions?: ScheduleJobOptions
  }) {
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
        `[RedwoodJob] Exception when scheduling ${payload.job}`,
        e as Error,
      )
    }
  }
}
