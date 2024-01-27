import path from 'path'

import chalk from 'chalk'
import { config } from 'dotenv-defaults'
import Fastify from 'fastify'

import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import { getPaths } from '@redwoodjs/project-config'

import type { ServeWebOptions } from './types'

export { ServeWebOptions }

export async function serveWeb(options: ServeWebOptions = {}) {
  const start = Date.now()
  console.log(chalk.italic.dim('Starting Web Server...'))

  if (!process.env.REDWOOD_ENV_FILES_LOADED) {
    config({
      path: path.join(getPaths().base, '.env'),
      defaults: path.join(getPaths().base, '.env.defaults'),
      multiline: true,
    })
  }

  options.logger ??= {
    level:
      process.env.LOG_LEVEL ?? process.env.NODE_ENV === 'development'
        ? 'debug'
        : 'warn',
  }

  const fastify = Fastify({
    requestTimeout: 15_000,
    logger: options.logger,
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: options,
  })

  const address = await fastify.listen({
    port: options.port,
    host: options.host,
  })

  console.log(chalk.italic.dim('Took ' + (Date.now() - start) + ' ms'))
  console.log(`Server listening at ${chalk.green(address)}`)
}
