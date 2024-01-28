import fs from 'fs'
import path from 'path'
import { parseArgs } from 'util'

import fastifyUrlData from '@fastify/url-data'
import c from 'ansi-colors'
import { config } from 'dotenv-defaults'
import fg from 'fast-glob'
import fastify from 'fastify'
import type {
  FastifyListenOptions,
  FastifyServerOptions,
  FastifyInstance,
  HookHandlerDoneFunction,
} from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import type { GlobalContext } from '@redwoodjs/context'
import { getAsyncStoreInstance } from '@redwoodjs/context/dist/store'
import { getConfig, getPaths } from '@redwoodjs/project-config'

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

  process.env.REDWOOD_ENV_FILES_LOADED = 'true'
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
  const { apiRootPath, fastifyServerOptions, port } = resolveOptions(options)

  // Warn about `api/server.config.js`
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

  // Initialize the fastify instance
  const server: Server = Object.assign(fastify(fastifyServerOptions), {
    // `start` will get replaced further down in this file
    start: async () => {
      throw new Error('Not implemented yet')
    },
  })

  server.addHook('onRequest', (_req, _reply, done) => {
    getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
  })

  await server.register(redwoodFastifyFunctions, { redwood: { apiRootPath } })

  // If we can find `api/dist/functions/graphql.js`, register the GraphQL plugin
  const [graphqlFunctionPath] = await fg('dist/functions/graphql.{ts,js}', {
    cwd: getPaths().api.base,
    absolute: true,
  })

  if (graphqlFunctionPath) {
    const { redwoodFastifyGraphQLServer } = require('./plugins/graphql')
    // This comes from a babel plugin that's applied to api/dist/functions/graphql.{ts,js} in user projects
    const { __rw_graphqlOptions } = require(graphqlFunctionPath)

    await server.register(redwoodFastifyGraphQLServer, {
      redwood: {
        apiRootPath,
        graphql: __rw_graphqlOptions,
      },
    })
  }

  // For baremetal and pm2. See https://github.com/redwoodjs/redwood/pull/4744
  server.addHook('onReady', (done) => {
    process.send?.('ready')
    done()
  })

  // Just logging. The conditional here is to appease TS.
  // `server.server.address()` can return a string, an AddressInfo object, or null.
  // Note that the logging here ("Listening on...") seems to be duplicated, probably by `@redwoodjs/graphql-server`
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
    return server.listen({
      ...options,
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    })
  }

  return server
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

export async function redwoodFastifyFunctions(
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
    fastGlobOptions: {
      ignore: ['**/dist/functions/graphql.js'],
    },
  })

  done()
}
