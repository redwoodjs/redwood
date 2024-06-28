import console from 'node:console'
import path from 'node:path'

import { registerApiSideBabelHook } from '@redwoodjs/babel-config'
import { getPaths, resolveFile } from '@redwoodjs/project-config'

import {
  AdapterNotFoundError,
  JobsLibNotFoundError,
  JobNotFoundError,
} from './errors'

// TODO Don't use this in production, import from dist directly
registerApiSideBabelHook()

export const loadAdapter = async () => {
  if (getPaths().api.jobs) {
    const { default: jobsModule } = await import(getPaths().api.jobsConfig)
    if (jobsModule.adapter) {
      return jobsModule.adapter
    } else {
      throw new AdapterNotFoundError()
    }
  } else {
    throw new JobsLibNotFoundError()
  }
}

export const loadLogger = async () => {
  try {
    const { default: loggerModule } = await import(getPaths().api.logger)
    return loggerModule.logger
  } catch (e) {
    return console
  }
}

export const loadJob = async (name) => {
  try {
    const filename = resolveFile(path.join(getPaths().api.jobs, name))
    const { default: jobModule } = await import(filename)
    return jobModule
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') {
      throw new JobNotFoundError(name)
    } else {
      throw e
    }
  }
}
