// Base class for all jobs, providing a common interface for scheduling jobs.
// At a minimum you must implement the `perform` method in your job subclass.

import type { BaseAdapter } from '../adapters/BaseAdapter'
import type { BasicLogger } from '../types'

import { DEFAULT_LOGGER, DEFAULT_QUEUE, DEFAULT_PRIORITY } from './consts'
import {
  AdapterNotConfiguredError,
  SchedulingError,
  PerformError,
} from './errors'

export interface JobConfigOptions {
  adapter: BaseAdapter
  logger?: BasicLogger
}

export interface JobSetOptions {
  wait?: number
  waitUntil?: Date
  queue?: string
  priority?: number
}

export abstract class RedwoodJob<TPerformArgs extends Array<unknown>> {
  /** The adapter to use for scheduling all jobs of this class */
  static adapter: BaseAdapter

  /**
   * The logger to use when scheduling all jobs of the class. Defaults to
   * `console` if not explicitly set.
   */
  static logger: BasicLogger = DEFAULT_LOGGER

  /** The queue that all jobs of this class will be enqueued to */
  static queue: string = DEFAULT_QUEUE

  /**
   * The priority that all jobs of this class will be given
   * Lower numbers are higher priority (1 is executed before 100)
   */
  static priority: number = DEFAULT_PRIORITY

  /** Configure all jobs to use a specific adapter and logger */
  static config(options: JobConfigOptions) {
    if ('adapter' in options) {
      this.adapter = options.adapter
    }

    if ('logger' in options && options.logger) {
      this.logger = options.logger
    }
  }

  /** Class method to schedule a job to run later */
  static performLater<
    TClass extends RedwoodJob<TPerformArgs>,
    TPerformArgs extends Array<unknown>,
  >(this: new () => TClass, ...args: TPerformArgs) {
    return new this().performLater(...args)
  }

  /** Class method to run the job immediately in the current process */
  static performNow<
    TClass extends RedwoodJob<TPerformArgs>,
    TPerformArgs extends Array<unknown>,
  >(this: new () => TClass, ...args: TPerformArgs) {
    return new this().performNow(...args)
  }

  /** Set options on the job before enqueueing it */
  static set<
    TClass extends RedwoodJob<TPerformArgs>,
    TPerformArgs extends Array<unknown>,
  >(this: new (options: JobSetOptions) => TClass, options: JobSetOptions = {}) {
    return new this(options)
  }

  /** Private property to store options set on the job. Use `set` to modify */
  #options: JobSetOptions = {};

  /**
   * This is needed so that TS knows it's safe to do
   * `this.constructor.<static member>`, like `this.constructor.adapter`
   */
  declare ['constructor']: typeof RedwoodJob

  /**
   * A job can be instantiated manually, but this will also be invoked
   * automatically by .set() or .performLater()
   */
  constructor(options: JobSetOptions = {}) {
    this.set(options)

    if (!this.constructor.adapter) {
      throw new AdapterNotConfiguredError()
    }
  }

  /**
   * Set options on the job before enqueueing it, merges with any existing
   * options set upon instantiation
   */
  set(options: JobSetOptions = {}) {
    this.#options = { ...this.#options, ...options }
    return this
  }

  /** Schedule a job to run later */
  performLater(...args: TPerformArgs) {
    this.logger.info(
      this.#payload(args),
      `[RedwoodJob] Scheduling ${this.constructor.name}`,
    )

    return this.#schedule(args)
  }

  /** Run the job immediately, within in the current process */
  performNow(...args: TPerformArgs): ReturnType<this['perform']> {
    this.logger.info(
      this.#payload(args),
      `[RedwoodJob] Running ${this.constructor.name} now`,
    )

    try {
      return this.perform(...args)
    } catch (e: any) {
      if (e instanceof TypeError) {
        throw e
      } else {
        throw new PerformError(
          `[${this.constructor.name}] exception when running job`,
          e,
        )
      }
    }
  }

  /** Must be implemented by the subclass */
  abstract perform(...args: TPerformArgs): any

  /** Make private this.#options available as a getter only */
  get options() {
    return this.#options
  }

  get adapter() {
    return this.constructor.adapter
  }

  get logger() {
    return this.constructor.logger
  }

  get queue() {
    return this.#options.queue || this.constructor.queue
  }

  get priority() {
    return this.#options.priority || this.constructor.priority
  }

  get wait() {
    return this.#options.wait
  }

  get waitUntil() {
    return this.#options.waitUntil
  }

  /**
   * Determines when the job should run.
   *
   * - If no options were set, defaults to running as soon as possible
   * - If a `wait` option is present it sets the number of seconds to wait
   * - If a `waitUntil` option is present it runs at that specific datetime
   */
  get runAt() {
    if (this.#options.wait) {
      return new Date(new Date().getTime() + this.#options.wait * 1000)
    } else if (this.#options.waitUntil) {
      return this.#options.waitUntil
    } else {
      return new Date()
    }
  }

  /**
   * Private method that constructs the object to be sent to the adapter for
   * scheduling
   */
  #payload(args: unknown) {
    return {
      handler: this.constructor.name,
      args,
      runAt: this.runAt,
      queue: this.queue,
      priority: this.priority,
    }
  }

  /**
   * Private, schedules a job with the appropriate adapter, returns whatever
   * the adapter returns in response to a successful schedule.
   */
  #schedule(args: unknown) {
    try {
      return this.constructor.adapter.schedule(this.#payload(args))
    } catch (e: any) {
      throw new SchedulingError(
        `[RedwoodJob] Exception when scheduling ${this.constructor.name}`,
        e,
      )
    }
  }
}
