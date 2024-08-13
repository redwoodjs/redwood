// Defines the basic shape of a logger that RedwoodJob will invoke to print
// debug messages. RedwoodJob will fallback to use `console` if no
// logger is passed in to RedwoodJob or any adapter. Luckily both Redwood's

import type { BaseAdapter } from './adapters/BaseAdapter/BaseAdapter'

// Redwood's logger and the standard console logger conform to this shape.
export interface BasicLogger {
  debug: (message?: any, ...optionalParams: any[]) => void
  info: (message?: any, ...optionalParams: any[]) => void
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
}

// This is the minimum interface that a "job" must conform to in order to be
// scheduled and executed by Redwood's job engine.
export interface BaseJob {
  id: string | number
  name: string
  path: string
  args: unknown[]
  attempts: number
}
export type PossibleBaseJob = BaseJob | undefined

export type Adapters = Record<string, BaseAdapter>

export interface WorkerConfig<TAdapters extends Adapters, TQueues extends string[]> {
  /**
   * The name of the adapter to use for this worker. This must be one of the keys
   * in the `adapters` object when you created the `JobManager`.
   */
  adapter: keyof TAdapters

  /**
   * The queue or queues that this worker should work on. You can pass a single
   * queue name, an array of queue names, or the string `'*'` to work on all
   * queues.
   */
  queue: '*' | TQueues[number] | TQueues[number][]

  /**
   * The maximum number of retries to attempt for a job before giving up.
   *
   * @default 24
   */
  maxAttempts?: number

  /**
   * The maximum amount of time in seconds that a job can run before another
   * worker will attempt to retry it.
   *
   * @default 14,400 (4 hours)
   */
  maxRuntime?: number

  /**
   * Whether a job that exceeds its `maxAttempts` should be deleted from the
   * queue. If `false`, the job will remain in the queue but will not be
   * processed further.
   *
   * @default false
   */
  deleteFailedJobs?: boolean

  /**
   * The amount of time in seconds to wait between polling the queue for new
   * jobs. Some adapters may not need this if they do not poll the queue and
   * instead rely on a subscription model.
   *
   * @default 5
   */
  sleepDelay?: number

  /**
   * The number of workers to spawn for this worker configuration.
   *
   * @default 1
   */
  count?: number

  /**
   * The logger to use for this worker. If not provided, the logger from the
   * `JobManager` will be used.
   */
  logger?: BasicLogger
}

export interface JobManagerConfig<
  //
  TAdapters extends Adapters,
  TQueues extends string[],
  TLogger extends BasicLogger,
  //
> {
  /**
   * An object containing all of the adapters that this job manager will use.
   * The keys should be the names of the adapters and the values should be the
   * adapter instances.
   */
  adapters: TAdapters

  /**
   * The logger to use for this job manager. If not provided, the logger will
   * default to the console.
   */
  logger: TLogger

  /**
   * An array of all of queue names that jobs can be scheduled on to. Workers can
   * be configured to work on a selection of these queues.
   */
  queues: TQueues

  /**
   * An array of worker configurations that define how jobs should be processed.
   */
  workers: WorkerConfig<TAdapters, TQueues>[]
}

export interface CreateSchedulerConfig<TAdapters extends Adapters> {
  /**
   * The name of the adapter to use for this scheduler. This must be one of the keys
   * in the `adapters` object when you created the `JobManager`.
   */
  adapter: keyof TAdapters

  /**
   * The logger to use for this scheduler. If not provided, the logger from the
   * `JobManager` will be used.
   */
  logger?: BasicLogger
}

export interface JobDefinition<
  TQueues extends string[],
  TArgs extends unknown[] = [],
> {
  /**
   * The name of the queue that this job should always be scheduled on. This defaults
   * to the queue that the scheduler was created with, but can be overridden when
   * scheduling a job.
   */
  queue: TQueues[number]

  /**
   * The priority of the job in the range of 0-100. The lower the number, the
   * higher the priority. The default is 50.
   * @default 50
   */
  priority?: PriorityValue

  /**
   * The function to run when this job is executed.
   *
   * @param args The arguments that were passed when the job was scheduled.
   */
  perform: (...args: TArgs) => Promise<void> | void
}

export type JobComputedProperties = {
  /**
   * The name of the job that was defined in the job file.
   */
  name: string

  /**
   * The path to the job file that this job was defined in.
   */
  path: string
}

export type Job<
  TQueues extends string[],
  TArgs extends unknown[] = [],
> = JobDefinition<TQueues, TArgs> & JobComputedProperties

export type ScheduleJobOptions =
  | {
      /**
       * The number of seconds to wait before scheduling this job. This is mutually
       * exclusive with `waitUntil`.
       */
      wait: number
      waitUntil?: never
    }
  | {
      wait?: never
      /**
       * The date and time to schedule this job for. This is mutually exclusive with
       * `wait`.
       */
      waitUntil: Date
    }

type PriorityValue =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
