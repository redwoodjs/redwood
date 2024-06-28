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

export function makeFilePath(path) {
  return pathToFileURL(path).href
}

// Loads the exported adapter from the app's jobs config in api/src/lib/jobs.js
export const loadAdapter = async () => {
  if (getPaths().api.jobs) {
    const { default: jobsModule } = await import(
      makeFilePath(getPaths().api.jobsConfig)
    )
    if (jobsModule.adapter) {
      return jobsModule.adapter
    } else {
      throw new AdapterNotFoundError()
    }
  } else {
    throw new JobsLibNotFoundError()
  }
}

// Loads the logger from the app's filesystem in api/src/lib/logger.js
export const loadLogger = async () => {
  try {
    const { default: loggerModule } = await import(
      makeFilePath(getPaths().api.logger)
    )
    return loggerModule.logger
  } catch (e) {
    return console
  }
}

// Loads a job from the app's filesystem in api/src/jobs
export const loadJob = async (name) => {
  const files = fg.sync(`**/${name}.*`, { cwd: getPaths().api.jobs })
  if (!files[0]) {
    throw new JobNotFoundError(name)
  }
  const { default: jobModule } = await import(
    makeFilePath(path.join(getPaths().api.jobs, files[0]))
  )
  return jobModule
}
