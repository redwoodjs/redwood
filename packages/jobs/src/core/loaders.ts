import path from 'node:path'
import { pathToFileURL } from 'node:url'

import fg from 'fast-glob'

import { registerApiSideBabelHook } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { JobsLibNotFoundError, JobNotFoundError } from './errors'

if (process.env.NODE_ENV !== 'production') {
  registerApiSideBabelHook()
}

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

// Loads the named export from the app's jobs config in api/src/lib/jobs.{js,ts}
// to configure the worker, defaults to `workerConfig`
export const loadJobsConfig = async () => {
  const jobsConfigPath =
    process.env.NODE_ENV === 'production'
      ? getPaths().api.distJobsConfig
      : getPaths().api.jobsConfig

  console.info('loading config from', jobsConfigPath)

  if (jobsConfigPath) {
    return require(jobsConfigPath)
  } else {
    throw new JobsLibNotFoundError()
  }
}

// Loads a job from the app's filesystem in api/src/jobs
export const loadJob = async (name: string) => {
  const baseJobsPath =
    process.env.NODE_ENV === 'production'
      ? getPaths().api.distJobs
      : getPaths().api.jobs

  console.info('loading jobs from', baseJobsPath)

  // Specifying {js,ts} extensions, so we don't accidentally try to load .json
  // files or similar
  const files = fg.sync(`**/${name}.{js,ts}`, { cwd: baseJobsPath })
  if (!files[0]) {
    throw new JobNotFoundError(name)
  }
  const jobModule = require(path.join(baseJobsPath, files[0]))
  return jobModule
}
