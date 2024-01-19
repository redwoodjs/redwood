import fs from 'fs'
import path from 'path'
import { parseArgs as _parseArgs } from 'util'

import fastifyUrlData from '@fastify/url-data'
import c from 'ansi-colors'
// @ts-expect-error can't be typed
import { config } from 'dotenv-defaults'
import fastify from 'fastify'
import type {
  FastifyListenOptions,
  FastifyServerOptions,
  FastifyInstance,
  HookHandlerDoneFunction,
} from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import { getConfig, getPaths } from '@redwoodjs/project-config'

import { redwoodFastifyGraphQLServer } from './plugins/graphql'
import {
  loadFunctionsFromDist,
  lambdaRequestHandler,
} from './plugins/lambdaLoader'

type StartOptions = Omit<FastifyListenOptions, 'port' | 'host'>

interface Server extends FastifyInstance {
  start: (options?: StartOptions) => Promise<string>
}

// Load .env files if they haven't already been loaded. This makes importing this file effectful:
//
// ```js
// # Loads dotenv...
// import { createServer } from '@redwoodjs/api-server'
// ```
//
// We do it here and not in the function below so that users can access env vars before calling `createServer`
if (process.env.RWJS_CWD && !process.env.REDWOOD_ENV_FILES_LOADED) {
  config({
    path: path.join(getPaths().base, '.env'),
    defaults: path.join(getPaths().base, '.env.defaults'),
    multiline: true,
  })
}

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

/**
 * Creates a server for api functions:
 *
 * ```js
 * import { createServer } from '@redwoodjs/api-server'
 *
 * import { logger } from 'src/lib/logger'
 *
  async function main() {
 *   const server = await createServer({
 *     logger,
 *     apiRootPath: 'api'
 *   })
 *
 *   // Configure the returned fastify instance:
 *   server.register(myPlugin)
 *
 *   // When ready, start the server:
 *   await server.start()
 * }
 *
 * main()
 * ```
 */
export async function createServer(options: CreateServerOptions = {}) {
  const { apiRootPath, fastifyServerOptions } =
    resolveCreateServerOptions(options)

  // ------------------------
  // Warn about `api/server.config.js`.
  const serverConfigPath = path.join(
    getPaths().base,
    getConfig().api.serverConfig
  )

  if (fs.existsSync(serverConfigPath)) {
    console.warn(
      c.yellow(
        [
          '',
          `Ignoring \`config\` and \`configureServer\` in api/server.config.js.`,
          `Migrate them to api/src/server.{ts,js}:`,
          '',
          `\`\`\`js title="api/src/server.{ts,js}"`,
          '// Pass your config to `createServer`',
          'const server = createServer({',
          '  fastifyServerOptions: myFastifyConfig',
          '})',
          '',
          '// Then inline your `configureFastify` logic:',
          'server.register(myFastifyPlugin)',
          '```',
          '',
        ].join('\n')
      )
    )
  }

  // ------------------------
  // Initialize the fastify instance.
  const server: Server = Object.assign(fastify(fastifyServerOptions), {
    // `start` will get replaced further down in this file
    start: async () => {
      throw new Error('Not added yet')
    },
  })
  await server.register(redwoodFastify, { redwood: { apiRootPath } })
  await server.register(redwoodFastifyGraphQLServer, {
    redwood: { apiRootPath },
  })

  // ------------------------
  // See https://github.com/redwoodjs/redwood/pull/4744.
  server.addHook('onReady', (done) => {
    process.send?.('ready')
    done()
  })

  // ------------------------
  // Just logging. The conditional here is to appease TS.
  // `server.server.address()` can return a string, an AddressInfo object, or null.
  // Note that the logging here ("Listening on...") seems to be duplicated, probably by `@redwoodjs/graphql-server`.
  server.addHook('onListen', (done) => {
    const addressInfo = server.server.address()

    if (!addressInfo || typeof addressInfo === 'string') {
      done()
      return
    }

    console.log(
      `Listening on ${c.magenta(
        `http://${addressInfo.address}:${addressInfo.port}${apiRootPath}`
      )}`
    )
    done()
  })

  /**
   * A wrapper around `fastify.listen` that handles `--port`, `REDWOOD_API_PORT` and [api].port in redwood.toml
   *
   * The order of precedence is:
   * - `--port`
   * - `REDWOOD_API_PORT`
   * - [api].port in redwood.toml
   */
  server.start = (options: StartOptions = {}) => {
    return server.listen(resolveStartOptions(options))
  }

  return server
}

type ResolvedCreateServerOptions = Required<
  Omit<CreateServerOptions, 'logger' | 'fastifyServerOptions'> & {
    fastifyServerOptions: FastifyServerOptions
  }
>

export function resolveCreateServerOptions(
  options: CreateServerOptions = {}
): ResolvedCreateServerOptions {
  options.logger ??= DEFAULT_CREATE_SERVER_OPTIONS.logger

  // Set defaults.
  const resolvedOptions: ResolvedCreateServerOptions = {
    apiRootPath:
      options.apiRootPath ?? DEFAULT_CREATE_SERVER_OPTIONS.apiRootPath,

    fastifyServerOptions: options.fastifyServerOptions ?? {
      requestTimeout:
        DEFAULT_CREATE_SERVER_OPTIONS.fastifyServerOptions.requestTimeout,
      logger: options.logger ?? DEFAULT_CREATE_SERVER_OPTIONS.logger,
    },
  }

  // Merge fastifyServerOptions.
  resolvedOptions.fastifyServerOptions.requestTimeout ??=
    DEFAULT_CREATE_SERVER_OPTIONS.fastifyServerOptions.requestTimeout
  resolvedOptions.fastifyServerOptions.logger = options.logger

  // Ensure the apiRootPath begins and ends with a slash.
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

  return resolvedOptions
}

type DefaultCreateServerOptions = Required<
  Omit<CreateServerOptions, 'fastifyServerOptions'> & {
    fastifyServerOptions: Pick<FastifyServerOptions, 'requestTimeout'>
  }
>

export const DEFAULT_CREATE_SERVER_OPTIONS: DefaultCreateServerOptions = {
  apiRootPath: '/',
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
  fastifyServerOptions: {
    requestTimeout: 15_000,
  },
}

export interface RedwoodFastifyAPIOptions {
  redwood: {
    apiRootPath: string
  }
}

// TODO: isolate context.
export async function redwoodFastify(
  fastify: FastifyInstance,
  opts: RedwoodFastifyAPIOptions,
  done: HookHandlerDoneFunction
) {
  fastify.register(fastifyUrlData)
  await fastify.register(fastifyRawBody)

  fastify.addContentTypeParser(
    ['application/x-www-form-urlencoded', 'multipart/form-data'],
    { parseAs: 'string' },
    fastify.defaultTextParser
  )

  fastify.all(`${opts.redwood.apiRootPath}:routeName`, lambdaRequestHandler)
  fastify.all(`${opts.redwood.apiRootPath}:routeName/*`, lambdaRequestHandler)

  await loadFunctionsFromDist({
    filterFn: (fnPath) => fnPath.endsWith('graphql.js'),
  })

  done()
}

function resolveStartOptions(
  options: Omit<FastifyListenOptions, 'port' | 'host'>
): FastifyListenOptions {
  const resolvedOptions: FastifyListenOptions = options

  // Right now, `host` isn't configurable and is set based on `NODE_ENV` for Docker.
  resolvedOptions.host =
    process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'

  const args = parseArgs()

  if (args.port) {
    resolvedOptions.port = args.port
  } else {
    if (process.env.REDWOOD_API_PORT === undefined) {
      resolvedOptions.port = getConfig().api.port
    } else {
      resolvedOptions.port = parseInt(process.env.REDWOOD_API_PORT)
    }
  }

  return resolvedOptions
}

/**
 * The `args` parameter is just for testing. `_parseArgs` defaults to `process.argv`, which is what we want.
 * This is also exported just for testing.
 */
export function parseArgs(args?: string[]) {
  const options = {
    apiRootPath: {
      type: 'string',
    },
    port: {
      type: 'string',
      short: 'p',
    },
  }

  const { values } = _parseArgs({
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
    // @ts-expect-error TODO
    options,
  })

  const parsedArgs: { port?: number } = {}

  if (values.port) {
    parsedArgs.port = +values.port

    if (isNaN(parsedArgs.port)) {
      throw new Error('`--port` must be a number')
    }
  }

  return parsedArgs
}
