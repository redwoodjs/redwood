import path from 'node:path'

import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/project-config'

import { AdapterNotFoundError, JobsLibNotFoundError } from '../core/errors'

export const loadAdapter = async (logger) => {
  const files = fg.sync('jobs.*', { cwd: getPaths().api.lib })

  if (files.length) {
    try {
      const loggerModule = await import(path.join(getPaths().api.lib, files[0]))
      return loggerModule.adapter
    } catch (e) {
      // api/src/lib/jobs.js doesn't exist or doesn't export `adapter`
      throw new AdapterNotFoundError()
    }
  } else {
    throw new JobsLibNotFoundError()
  }

  return null
}

export const loadLogger = async () => {
  const files = fg.sync('logger.*', { cwd: getPaths().api.lib })

  if (files.length) {
    // try {
    const loggerModule = await import(path.join(getPaths().api.lib, files[0]))
    return loggerModule.logger
    // } catch (e) {
    // import didn't work for whatever reason, fall back to console
    // }
  }

  return null
}
