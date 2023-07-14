import path from 'path'

import chalk from 'chalk'
import { config } from 'dotenv-defaults'
import Fastify from 'fastify'

import { getPaths, getConfig } from '@redwoodjs/project-config'

import { redwoodFastifyWeb } from './web'

export async function serve() {
  const redwoodProjectPaths = getPaths()
  const redwoodConfig = getConfig()

  const port = redwoodConfig.web.port

  const tsServer = Date.now()

  // Load .env files
  config({
    path: path.join(redwoodProjectPaths.base, '.env'),
    defaults: path.join(redwoodProjectPaths.base, '.env.defaults'),
    multiline: true,
  })

  console.log(chalk.italic.dim('Starting API and Web Servers...'))

  // Configure Fastify
  const fastify = Fastify({
    requestTimeout: 15_000,
    logger: {
      // Note: If running locally using `yarn rw serve` you may want to adust
      // the default non-development level to `info`
      level:
        process.env.LOG_LEVEL ?? process.env.NODE_ENV === 'development'
          ? 'debug'
          : 'warn',
    },
  })

  await fastify.register(redwoodFastifyWeb)

  // Start
  fastify.listen({ port })

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsServer) + ' ms'))
    const webServer = chalk.green(`http://localhost:${port}`)
    console.log(`Web server started on ${webServer}`)
  })

  process.on('exit', () => {
    fastify.close()
  })
}
