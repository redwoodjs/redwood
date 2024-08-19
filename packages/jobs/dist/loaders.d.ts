import type { JobManager } from './core/JobManager';
import type { Adapters, BasicLogger, Job, JobComputedProperties } from './types';
/**
 * Loads the job manager from the users project
 *
 * @returns JobManager
 */
export declare const loadJobsManager: () => Promise<JobManager<Adapters, string[], BasicLogger>>;
/**
 * Load a specific job implementation from the users project
 */
export declare const loadJob: ({ name: jobName, path: jobPath, }: JobComputedProperties) => Promise<Job<string[], unknown[]>>;
//# sourceMappingURL=loaders.d.ts.map