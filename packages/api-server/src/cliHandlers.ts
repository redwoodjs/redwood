import chalk from 'chalk'

import { redwoodFastifyAPI } from '@redwoodjs/fastify-functions'
import {
  createFastifyInstance,
  coerceRootPath,
  withApiProxy,
} from '@redwoodjs/fastify-shared'
import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import { getConfig } from '@redwoodjs/project-config'

// import createFastifyInstance from './fastify'
// import withApiProxy from './plugins/withApiProxy'
// import withFunctions from './plugins/withFunctions'
// import withWebServer from './plugins/withWebServer'
// import { startServer as startFastifyServer } from './server'
import { BothServerArgs, WebServerArgs, ApiServerArgs } from './types'

/*
 * This file has defines CLI handlers used by the redwood cli, for `rw serve`
 * Also used in index.ts for the api server
 *
 * Update - 2023/07/26 - JGMW
 * This used to be true but we switched to using specific handlers exported from `@redwoodjs/web-server`
 * and `@redwoodjs/api-server` which themselves import functionality from various fastify packages
 * `@redwoodjs/fastify-...`
 */

const sendProcessReady = () => {
  return process.send && process.send('ready')
}

export const commonOptions = {
  port: { default: getConfig().web?.port || 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
} as const

export const apiCliOptions = {
  port: { default: getConfig().api?.port || 8911, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  apiRootPath: {
    alias: ['rootPath', 'root-path'],
    default: '/',
    type: 'string',
    desc: 'Root path where your api functions are served',
    coerce: coerceRootPath,
  },
} as const

export const webCliOptions = {
  port: { default: getConfig().web?.port || 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  apiHost: {
    alias: 'api-host',
    type: 'string',
    desc: 'Forward requests from the apiUrl, defined in redwood.toml to this host',
  },
} as const

export const apiServerHandler = async (options: ApiServerArgs) => {
  const startTime = Date.now()

  const { port, socket, apiRootPath } = options
  console.log(chalk.dim.italic('Starting API Server...'))

  const fastify = createFastifyInstance()

  // Import Server Functions.
  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
    },
  })

  let listenOptions

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  fastify.listen(listenOptions)

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)

    console.log(chalk.italic.dim('Took ' + (Date.now() - startTime) + ' ms'))
    const on = socket
      ? socket
      : chalk.magenta(`http://localhost:${port}${apiRootPath}`)

    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

export const bothServerHandler = async (options: BothServerArgs) => {
  const startTime = Date.now()

  const { port, socket } = options
  console.log(chalk.dim.italic('Starting API and Web Servers...'))
  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  const fastify = createFastifyInstance()

  // Attach plugins
  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      // apiHost: Don't proxy requests because we're running the api server here too
    },
  })
  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      apiRootPath,
    },
  })

  let listenOptions:
    | { path: string; port?: never; host?: never }
    | { path?: never; port?: number; host?: string }

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  // Start
  fastify.listen(listenOptions)

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)

    console.log(chalk.italic.dim('Took ' + (Date.now() - startTime) + ' ms'))
    if (socket) {
      console.log(`Web server started on ${socket}`)
    } else {
      console.log(`Web server started on http://localhost:${port}`)
    }

    // TODO: Do we need to restore this?
    // console.log(`Web server started on ${webServer}`)
    // console.log(`API serving from ${apiServer}`)
    // console.log(`API listening on ${on}`)
    // const graphqlEnd = c.magenta(`${apiRootPath}graphql`)
    // console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

export const webServerHandler = async (options: WebServerArgs) => {
  const startTime = Date.now()

  const { port, socket, apiHost } = options
  console.log(chalk.dim.italic('Starting Web Server...'))
  const apiUrl = getConfig().web.apiUrl

  // TODO: Should we restore this?
  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  // const graphqlEndpoint = coerceRootPath(
  //   getConfig().web.apiGraphQLUrl ?? `${apiUrl}/graphql`
  // )

  const fastify = createFastifyInstance()

  // serve static files from "web/dist"
  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    // Attach plugin for proxying
    fastify.register(withApiProxy, { apiHost, apiUrl })
  }

  let listenOptions:
    | { path: string; port?: never; host?: never }
    | { path?: never; port?: number; host?: string }

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  fastify.listen(listenOptions)

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)

    console.log(chalk.italic.dim('Took ' + (Date.now() - startTime) + ' ms'))
    if (socket) {
      console.log(`Web server started on ${socket}`)
    } else {
      console.log(`Web server started on http://localhost:${port}`)
    }

    // TODO: Should we restore this log? I think it's a little weird
    // console.log(`GraphQL endpoint is set to ` + c.magenta(`${graphqlEndpoint}`))

    sendProcessReady()
  })
}
