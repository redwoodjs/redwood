import { parseArgs } from 'util'

import type { FastifyServerOptions } from 'fastify'

import { getConfig } from '@redwoodjs/project-config'

export interface CreateServerOptions {
  /**
   * The prefix for all routes. Defaults to `/`.
   */
  apiRootPath?: string

  /**
   * Logger instance or options.
   */
  logger?: FastifyServerOptions['logger']

  /**
   * Options for the fastify server instance.
   * Omitting logger here because we move it up.
   */
  fastifyServerOptions?: Omit<FastifyServerOptions, 'logger'>
}

type DefaultCreateServerOptions = Required<
  Omit<CreateServerOptions, 'fastifyServerOptions'> & {
    fastifyServerOptions: Pick<FastifyServerOptions, 'requestTimeout'>
  }
>

export const DEFAULT_CREATE_SERVER_OPTIONS: DefaultCreateServerOptions = {
  apiRootPath: '/',
  logger: {
    level:
      process.env.LOG_LEVEL ??
      (process.env.NODE_ENV === 'development' ? 'debug' : 'warn'),
  },
  fastifyServerOptions: {
    requestTimeout: 15_000,
  },
}

type ResolvedOptions = Required<
  Omit<CreateServerOptions, 'logger' | 'fastifyServerOptions'> & {
    fastifyServerOptions: FastifyServerOptions
    port: number
  }
>

export function resolveOptions(
  options: CreateServerOptions = {},
  args?: string[]
) {
  options.logger ??= DEFAULT_CREATE_SERVER_OPTIONS.logger

  let defaultPort: number | undefined

  if (process.env.REDWOOD_API_PORT === undefined) {
    defaultPort = getConfig().api.port
  } else {
    defaultPort = parseInt(process.env.REDWOOD_API_PORT)
  }

  // Set defaults.
  const resolvedOptions: ResolvedOptions = {
    apiRootPath:
      options.apiRootPath ?? DEFAULT_CREATE_SERVER_OPTIONS.apiRootPath,

    fastifyServerOptions: options.fastifyServerOptions ?? {
      requestTimeout:
        DEFAULT_CREATE_SERVER_OPTIONS.fastifyServerOptions.requestTimeout,
      logger: options.logger ?? DEFAULT_CREATE_SERVER_OPTIONS.logger,
    },

    port: defaultPort,
  }

  // Merge fastifyServerOptions.
  resolvedOptions.fastifyServerOptions.requestTimeout ??=
    DEFAULT_CREATE_SERVER_OPTIONS.fastifyServerOptions.requestTimeout
  resolvedOptions.fastifyServerOptions.logger = options.logger

  const { values } = parseArgs({
    options: {
      apiRootPath: {
        type: 'string',
      },
      port: {
        type: 'string',
        short: 'p',
      },
    },

    // When running Jest, `process.argv` is...
    //
    // ```js
    // [
    //    'path/to/node'
    //    'path/to/jest.js'
    //    'file/under/test.js'
    // ]
    // ```
    //
    // `parseArgs` strips the first two, leaving the third, which is interpreted as a positional argument.
    // Which fails our options. We'd still like to be strict, but can't do it for tests.
    strict: process.env.NODE_ENV === 'test' ? false : true,
    ...(args && { args }),
  })

  if (values.apiRootPath && typeof values.apiRootPath !== 'string') {
    throw new Error('`apiRootPath` must be a string')
  }

  if (values.apiRootPath) {
    resolvedOptions.apiRootPath = values.apiRootPath
  }

  // Format `apiRootPath`
  if (resolvedOptions.apiRootPath.charAt(0) !== '/') {
    resolvedOptions.apiRootPath = `/${resolvedOptions.apiRootPath}`
  }

  if (
    resolvedOptions.apiRootPath.charAt(
      resolvedOptions.apiRootPath.length - 1
    ) !== '/'
  ) {
    resolvedOptions.apiRootPath = `${resolvedOptions.apiRootPath}/`
  }

  if (values.port) {
    resolvedOptions.port = +values.port

    if (isNaN(resolvedOptions.port)) {
      throw new Error('`port` must be an integer')
    }
  }

  return resolvedOptions
}
