// Base class for all jobs, providing a common interface for scheduling jobs.
// At a minimum you must implement the `perform` method in your job subclass.

import {
  AdapterNotConfiguredError,
  PerformNotImplementedError,
  SchedulingError,
  PerformError,
} from './errors'

export const DEFAULT_QUEUE = 'default'

export class RedwoodJob {
  // The default queue for all jobs
  static queue = DEFAULT_QUEUE

  // The default priority for all jobs
  // Assumes a range of 1 - 100, 1 being highest priority
  static priority = 50

  // The adapter to use for scheduling jobs. Set via the static `config` method
  static adapter

  // Set via the static `config` method
  static logger

  // Configure all jobs to use a specific adapter
  static config(options) {
    if (options) {
      if (Object.keys(options).includes('adapter')) {
        this.adapter = options.adapter
      }
      if (Object.keys(options).includes('logger')) {
        this.logger = options.logger
      }
    }
  }

  // Class method to schedule a job to run later
  //   const scheduleDetails = RedwoodJob.performLater('foo', 'bar')
  static performLater(...args) {
    return new this().performLater(...args)
  }

  // Class method to run the job immediately in the current process
  //   const result = RedwoodJob.performNow('foo', 'bar')
  static performNow(...args) {
    return new this().performNow(...args)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  static set(options) {
    return new this().set(options)
  }

  // Private property to store options set on the job
  #options = {}

  // A job can be instantiated manually, but this will also be invoked
  // automatically by .set() or .performLater()
  constructor(options) {
    this.set(options)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  set(options = {}) {
    this.#options = { queue: this.queue, priority: this.priority, ...options }
    return this
  }

  // Instance method to schedule a job to run later
  //   const job = RedwoodJob
  //   const scheduleDetails = job.performLater('foo', 'bar')
  performLater(...args) {
    this.logger.info(
      this.payload(args),
      `[RedwoodJob] Scheduling ${this.constructor.name}`,
    )

    return this.#schedule(args)
  }

  // Instance method to runs the job immediately in the current process
  //   const result = RedwoodJob.performNow('foo', 'bar')
  async performNow(...args) {
    this.logger.info(
      this.payload(args),
      `[RedwoodJob] Running ${this.constructor.name} now`,
    )

    try {
      return await this.perform(...args)
    } catch (e) {
      if (e instanceof PerformNotImplementedError) {
        throw e
      } else {
        throw new PerformError(
          `[${this.constructor.name}] exception when running job`,
          e,
        )
      }
    }
  }

  // Must be implemented by the subclass
  perform() {
    throw new PerformNotImplementedError()
  }

  // Returns data sent to the adapter for scheduling
  payload(args) {
    return {
      handler: this.constructor.name,
      args,
      runAt: this.runAt,
      queue: this.queue,
      priority: this.priority,
    }
  }

  get logger() {
    return this.#options?.logger || this.constructor.logger
  }

  // Determines the name of the queue
  get queue() {
    return this.#options?.queue || this.constructor.queue
  }

  // Set the name of the queue directly on an instance of a job
  set queue(value) {
    this.#options = Object.assign(this.#options || {}, { queue: value })
  }

  // Determines the priority of the job
  get priority() {
    return this.#options?.priority || this.constructor.priority
  }

  // Set the priority of the job directly on an instance of a job
  set priority(value) {
    this.#options = Object.assign(this.#options || {}, {
      priority: value,
    })
  }

  // Determines when the job should run.
  //
  // - If no options were set, defaults to running as soon as possible
  // - If a `wait` option is present it sets the number of seconds to wait
  // - If a `waitUntil` option is present it runs at that specific datetime
  get runAt() {
    if (!this.#options?.runAt) {
      this.#options = Object.assign(this.#options || {}, {
        runAt: this.#options?.wait
          ? new Date(new Date().getTime() + this.#options.wait * 1000)
          : this.#options?.waitUntil
            ? this.#options.waitUntil
            : new Date(),
      })
    }

    return this.#options.runAt
  }

  // Set the runAt time on a job directly:
  //   const job = new RedwoodJob()
  //   job.runAt = new Date(2030, 1, 2, 12, 34, 56)
  //   job.performLater()
  set runAt(value) {
    this.#options = Object.assign(this.#options || {}, { runAt: value })
  }

  // Make private this.#options available as a getter only
  get options() {
    return this.#options
  }

  // Private, schedules a job with the appropriate adapter, returns whatever
  // the adapter returns in response to a successful schedule.
  async #schedule(args) {
    if (!this.constructor.adapter) {
      throw new AdapterNotConfiguredError()
    }

    try {
      return await this.constructor.adapter.schedule(this.payload(args))
    } catch (e) {
      throw new SchedulingError(
        `[RedwoodJob] Exception when scheduling ${this.constructor.name}`,
        e,
      )
    }
  }
}
