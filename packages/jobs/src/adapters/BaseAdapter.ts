// Base class for all job adapters. Provides a common interface for scheduling
// jobs. At a minimum, you must implement the `schedule` method in your adapter.
//
// Any object passed to the constructor is saved in `this.options` and should
// be used to configure your custom adapter. If `options.logger` is included
// you can access it via `this.logger`

import console from 'node:console'

import type { BasicLogger, BaseJob, SchedulePayload } from '../types'

export abstract class BaseAdapter {
  options: any
  logger: BasicLogger

  constructor(options: { logger?: BasicLogger }) {
    this.options = options
    this.logger = options?.logger || console
  }

  abstract schedule(payload: SchedulePayload): void

  abstract find(): BaseJob | null

  abstract clear(): void

  abstract success(job: BaseJob): void

  abstract failure(job: BaseJob, error: typeof Error): void
}
