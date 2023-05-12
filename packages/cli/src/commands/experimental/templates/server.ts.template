import path from 'path'

import chalk from 'chalk'
import { config } from 'dotenv-defaults'
import Fastify from 'fastify'

import {
  coerceRootPath,
  redwoodFastifyWeb,
  redwoodFastifyAPI,
  DEFAULT_REDWOOD_FASTIFY_CONFIG,
} from '@redwoodjs/fastify'
import { getPaths, getConfig } from '@redwoodjs/project-config'

async function serve() {
  // Load .env files
  const redwoodProjectPaths = getPaths()

  config({
    path: path.join(redwoodProjectPaths.base, '.env'),
    defaults: path.join(redwoodProjectPaths.base, '.env.defaults'),
    multiline: true,
  })

  const tsServer = Date.now()
  console.log(chalk.italic.dim('Starting API and Web Servers...'))

  // Configure Fastify
  const fastify = Fastify({
    ...DEFAULT_REDWOOD_FASTIFY_CONFIG,
  })

  const redwoodConfig = getConfig()

  const apiRootPath = coerceRootPath(redwoodConfig.web.apiUrl)
  const port = redwoodConfig.web.port

  await fastify.register(redwoodFastifyWeb)

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      apiRootPath,
    },
  })

  // Start
  fastify.listen({ port })

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsServer) + ' ms'))
    const on = chalk.magenta(`http://localhost:${port}${apiRootPath}`)
    const webServer = chalk.green(`http://localhost:${port}`)
    const apiServer = chalk.magenta(`http://localhost:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`API serving from ${apiServer}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)
  })

  process.on('exit', () => {
    fastify.close()
  })
}

serve()
