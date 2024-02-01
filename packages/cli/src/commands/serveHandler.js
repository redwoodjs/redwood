import path from 'path'

import concurrently from 'concurrently'
import execa from 'execa'

import {
  getAPIHost,
  getAPIPort,
  getWebHost,
  getWebPort,
} from '@redwoodjs/api-server/dist/cliHelpers'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { exitWithError } from '../lib/exit'

export const bothServerFileHandler = async (options) => {
  options.apiPort ??= getAPIPort()
  options.apiHost ??= getAPIHost()
  options.webPort ??= getWebPort()
  options.webHost ??= getWebHost()

  const apiProxyTarget = [
    'http://',
    options.apiHost.includes(':') ? `[${options.apiHost}]` : options.apiHost,
    ':',
    options.apiPort,
    options.apiRootPath,
  ].join('')

  const { result } = concurrently(
    [
      {
        name: 'api',
        command: `yarn node ${path.join('dist', 'server.js')} --port ${
          options.apiPort
        } --host ${options.apiHost} --api-root-path ${options.apiRootPath}`,
        cwd: getPaths().api.base,
        prefixColor: 'cyan',
      },
      {
        name: 'web',
        command: `yarn rw-web-server --port ${options.webPort} --host ${options.webHost} --api-proxy-target ${apiProxyTarget}`,
        cwd: getPaths().base,
        prefixColor: 'blue',
      },
    ],
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
      handleInput: true,
    }
  )

  try {
    await result
  } catch (error) {
    if (typeof error?.message !== 'undefined') {
      errorTelemetry(
        process.argv,
        `Error concurrently starting sides: ${error.message}`
      )
      exitWithError(error)
    }
  }
}

export const apiServerFileHandler = async (options) => {
  await execa(
    'yarn',
    [
      'node',
      'server.js',
      '--port',
      options.port,
      '--apiRootPath',
      options.apiRootPath,
    ],
    {
      cwd: getPaths().api.dist,
      stdio: 'inherit',
    }
  )
}
