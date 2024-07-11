import console from 'node:console'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import fg from 'fast-glob'

import { registerApiSideBabelHook } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import {
  AdapterNotFoundError,
  JobsLibNotFoundError,
  JobNotFoundError,
} from './errors'

// TODO Don't use this in production, import from dist directly
registerApiSideBabelHook()

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

// Loads the exported adapter from the app's jobs config in api/src/lib/jobs.{js,ts}
export const loadAdapter = async () => {
  const jobsConfigPath = getPaths().api.jobsConfig
  if (jobsConfigPath) {
    const jobsModule = require(jobsConfigPath)
    if (jobsModule.adapter) {
      return jobsModule.adapter
    } else {
      throw new AdapterNotFoundError()
    }
  } else {
    throw new JobsLibNotFoundError()
  }
}

// Loads the logger from the app's filesystem in api/src/lib/logger.{js,ts}
export const loadLogger = async () => {
  const loggerPath = getPaths().api.logger
  if (loggerPath) {
    try {
      const loggerModule = require(loggerPath)
      return loggerModule.logger
    } catch (e) {
      console.warn(
        'Tried to load logger but failed, falling back to console\n',
        e,
      )
    }
  }

  return console
}

// Loads a job from the app's filesystem in api/src/jobs
export const loadJob = async (name: string) => {
  // Specifying {js,ts} extensions, so we don't accidentally try to load .json
  // files or similar
  const files = fg.sync(`**/${name}.{js,ts}`, { cwd: getPaths().api.jobs })
  if (!files[0]) {
    throw new JobNotFoundError(name)
  }
  const jobModule = require(path.join(getPaths().api.jobs, files[0]))
  return jobModule
}
