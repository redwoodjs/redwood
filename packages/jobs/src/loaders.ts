import fs from 'node:fs'
import path from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

import type { JobManager } from './core/JobManager'
import { JobsLibNotFoundError, JobNotFoundError } from './errors'
import type { Adapters, BasicLogger, Job, JobComputedProperties } from './types'
import { makeFilePath } from './util'

/**
 * Loads the job manager from the users project
 *
 * @returns JobManager
 */
export const loadJobsManager = async (): Promise<
  JobManager<Adapters, string[], BasicLogger>
> => {
  // Confirm the specific lib/jobs.ts file exists
  const jobsConfigPath = getPaths().api.distJobsConfig
  if (!jobsConfigPath) {
    throw new JobsLibNotFoundError()
  }

  // Import the jobs manager
  const importPath = makeFilePath(jobsConfigPath)
  const { jobs } = await import(importPath)
  if (!jobs) {
    throw new JobsLibNotFoundError()
  }

  return jobs
}

/**
 * Load a specific job implementation from the users project
 */
export const loadJob = async ({
  name: jobName,
  path: jobPath,
}: JobComputedProperties): Promise<Job<string[], unknown[]>> => {
  // Confirm the specific job file exists
  const completeJobPath = path.join(getPaths().api.distJobs, jobPath) + '.js'
  const importPath = makeFilePath(completeJobPath)
  if (!fs.existsSync(importPath)) {
    throw new JobNotFoundError(jobName)
  }

  // Import the job
  const jobModule = await import(importPath)
  if (!jobModule[jobName]) {
    throw new JobNotFoundError(jobName)
  }

  return jobModule[jobName]
}
