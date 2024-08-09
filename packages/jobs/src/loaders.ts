import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getPaths } from '@redwoodjs/project-config'

import type { JobManager } from './core/JobManager'
import { JobsLibNotFoundError, JobNotFoundError } from './errors'
import type { Adapters, BasicLogger, Job } from './types'

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

// Loads the named export from the app's jobs config in api/src/lib/jobs.{js,ts}
// to configure the worker, defaults to `workerConfig`
export const loadJobsManager = (): JobManager<
  Adapters,
  string[],
  BasicLogger
> => {
  const jobsConfigPath = getPaths().api.distJobsConfig

  if (jobsConfigPath) {
    return require(jobsConfigPath).jobs
  } else {
    throw new JobsLibNotFoundError()
  }
}

// Loads a job from the app's filesystem in api/src/jobs
export const loadJob = ({
  name: jobName,
  path: jobPath,
}: {
  name: string
  path: string
}): Job<string[], unknown[]> => {
  const jobsPath = getPaths().api.distJobs

  let job

  try {
    job = require(path.join(jobsPath, jobPath))
  } catch (e) {
    throw new JobNotFoundError(jobName)
  }

  if (!job[jobName]) {
    throw new JobNotFoundError(jobName)
  }

  return job[jobName]
}
