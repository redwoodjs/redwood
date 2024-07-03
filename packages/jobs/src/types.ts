// Defines the basic shape of a logger that RedwoodJob will invoke to print
// debug messages. Both Redwood's Logger and the standard console object
// conform to this shape. RedwoodJob will fallback to use `console` if no
// logger is passed in to RedwoodJob or any adapter.
export interface BasicLogger {
  debug: (message?: any, ...optionalParams: any[]) => void
  info: (message?: any, ...optionalParams: any[]) => void
  warn: (message?: any, ...optionalParams: any[]) => void
  error: (message?: any, ...optionalParams: any[]) => void
}

// Arguments sent to an adapter to schedule a job
export interface SchedulePayload {
  handler: string
  args: any
  runAt: Date
  queue: string
  priority: number
}

// Arguments returned from an adapter when a job is found. This is the absolute
// minimum interface that's needed for the Executor to invoke the job, but any
// adapter will likely return more info, like the number of previous tries, so
// that it can reschedule the job to run in the future.
export interface BaseJob {
  handler: string
  args: any
}
