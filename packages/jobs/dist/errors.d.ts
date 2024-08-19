/**
 * Parent class for any RedwoodJob-related error
 */
export declare class RedwoodJobError extends Error {
    constructor(message: string);
}
/**
 * Thrown when trying to configure a scheduler without an adapter
 */
export declare class AdapterNotConfiguredError extends RedwoodJobError {
    constructor();
}
/**
 * Thrown when the Worker or Executor is instantiated without an adapter
 */
export declare class AdapterRequiredError extends RedwoodJobError {
    constructor();
}
/**
 * Thrown when the Worker is instantiated without an array of queues
 */
export declare class QueuesRequiredError extends RedwoodJobError {
    constructor();
}
/**
 * Thrown when the Executor is instantiated without a job
 */
export declare class JobRequiredError extends RedwoodJobError {
    constructor();
}
/**
 * Thrown when a job with the given handler is not found in the filesystem
 */
export declare class JobNotFoundError extends RedwoodJobError {
    constructor(name: string);
}
/**
 * Thrown when a job file exists, but the export does not match the filename
 */
export declare class JobExportNotFoundError extends RedwoodJobError {
    constructor(name: string);
}
/**
 * Thrown when the runner tries to import `adapter` from api/src/lib/jobs.js|ts and
 * the file does not exist
 */
export declare class JobsLibNotFoundError extends RedwoodJobError {
    constructor();
}
/**
 * Thrown when the runner tries to import `adapter` from api/src/lib/jobs.js|ts
 */
export declare class AdapterNotFoundError extends RedwoodJobError {
    constructor(name: string);
}
/**
 * Thrown when the runner tries to import `logger` from api/src/lib/jobs.js|ts
 */
export declare class LoggerNotFoundError extends RedwoodJobError {
    constructor(name: string);
}
/**
 * Thrown when the runner tries to import `workerConfig` from api/src/lib/jobs.js|ts
 */
export declare class WorkerConfigNotFoundError extends RedwoodJobError {
    constructor(name: string);
}
/**
 * Parent class for any job error where we want to wrap the underlying error
 * in our own. Use by extending this class and passing the original error to
 * the constructor:
 *
 * ```typescript
 * try {
 *   throw new Error('Generic error')
 * } catch (e) {
 *    throw new RethrowJobError('Custom Error Message', e)
 * }
 * ```
 */
export declare class RethrownJobError extends RedwoodJobError {
    originalError: Error;
    stackBeforeRethrow: string | undefined;
    constructor(message: string, error: Error);
}
/**
 * Thrown when there is an error scheduling a job, wraps the underlying error
 */
export declare class SchedulingError extends RethrownJobError {
    constructor(message: string, error: Error);
}
/**
 * Thrown when there is an error performing a job, wraps the underlying error
 */
export declare class PerformError extends RethrownJobError {
    constructor(message: string, error: Error);
}
export declare class QueueNotDefinedError extends RedwoodJobError {
    constructor();
}
export declare class WorkerConfigIndexNotFoundError extends RedwoodJobError {
    constructor(index: number);
}
//# sourceMappingURL=errors.d.ts.map