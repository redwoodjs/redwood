import { Scheduler } from './Scheduler'

class RedwoodJob {
  // config looks like:
  //   adapters: { [key: string]: BaseAdapter }
  //   queues: string[]
  //   logger: BasicLogger
  //   workers: WorkerConfig[]
  //     adapter: keyof this.config.adapters
  //     queue: oneof this.config.queues
  //     maxAttempts: number
  //     maxRuntime: number
  //     deleteFailedJobs: boolean
  //     sleepDelay: number
  //     count: number
  constructor(config) {
    this.config = config

    this.adapters = config.adapters
    this.queues = config.queues
    this.logger = config.logger
    this.workers = config.workers
  }

  // schedulerConfig:
  //  adapter: keyof this.config.adapters
  //  queue: oneof this.config.queues
  //  priority: number
  //  wait: number  (either/or)
  //  waitUntil: Date
  createScheduler(schedulerConfig) {
    const scheduler = new Scheduler({
      config: schedulerConfig,
      adapter: this.adapters[schedulerConfig.adapter],
      logger: this.logger,
    })

    return (job, jobArgs = [], jobOptions = {}) => {
      return scheduler.schedule(job, jobArgs, jobOptions)
    }
  }

  // jobDefinition looks like:
  //   queue: one of this.config.queues
  //   priority: number
  //   wait: number  (either/or)
  //   waitUntil: Date
  //   perform: function
  //   userDefinedFunction(s)
  createJob(jobDefinition) {
    return jobDefinition
  }

  createWorker() {
    // coming soon
  }
}
