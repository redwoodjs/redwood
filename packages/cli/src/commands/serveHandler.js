import chalk from 'chalk'

import {
  coerceRootPath,
  createFastifyInstance,
  redwoodFastifyAPI,
  redwoodFastifyWeb,
} from '@redwoodjs/fastify'
import { withApiProxy } from '@redwoodjs/fastify/dist/plugins/withApiProxy'
import { getConfig } from '@redwoodjs/project-config'

export const apiServerHandler = async (options) => {
  const { port, host, socket, apiRootPath } = options
  const tsApiServer = Date.now()

  console.log(chalk.dim.italic('Starting API Server...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
    },
  })

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host,
  })

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsApiServer) + ' ms'))

    const on = socket
      ? socket
      : chalk.magenta(`http://${host}:${port}${apiRootPath}`)

    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

export const bothServerHandler = async (options) => {
  const { port, host, socket } = options
  const tsServer = Date.now()

  console.log(chalk.italic.dim('Starting API and Web Servers...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
      apiRootPath,
    },
  })

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host,
  })

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsServer) + ' ms'))

    const on = socket
      ? socket
      : chalk.magenta(`http://${host}:${port}${apiRootPath}`)

    const webServer = chalk.green(`http://${host}:${port}`)
    const apiServer = chalk.magenta(`http://${host}:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`API serving from ${apiServer}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

export const webServerHandler = async (options) => {
  const redwoodProjectConfig = getConfig()
  const { port, host, socket, apiHost } = options

  const tsServer = Date.now()
  console.log(chalk.dim.italic('Starting Web Server...'))
  const apiUrl = redwoodProjectConfig.web.apiUrl

  // Construct the GraphQL URL from apiUrl by default.
  // But if apiGraphQLUrl is specified, use that instead.
  const graphqlEndpoint = coerceRootPath(
    redwoodProjectConfig.web.apiGraphQLUrl ?? `${apiUrl}/graphql`
  )

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  // serve static files from "web/dist"
  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  // TODO: Could this be folded into redwoodFastifyWeb?
  // If apiHost is supplied, it means the functions are running elsewhere, so we should just proxy requests.
  if (apiHost) {
    // Attach plugin for proxying
    fastify.register(withApiProxy, { apiHost, apiUrl })
  }

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host,
  })

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsServer) + ' ms'))

    if (socket) {
      console.log(`Listening on ` + chalk.magenta(`${socket}`))
    }

    const webServer = chalk.green(`http://${host}:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(
      `GraphQL endpoint is set to ` + chalk.magenta(`${graphqlEndpoint}`)
    )

    sendProcessReady()
  })
}

function sendProcessReady() {
  return process.send && process.send('ready')
}
