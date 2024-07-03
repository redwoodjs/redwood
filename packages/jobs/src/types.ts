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

// Arguments returned from an adapter when a job is found
export interface BaseJob {
  handler: string
  args: any
}
