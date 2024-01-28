import path from 'path'

import chalk from 'chalk'
import Fastify from 'fastify'
import fs from 'fs-extra'

import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import { getPaths } from '@redwoodjs/project-config'

import type { ParsedOptions } from './types'

export async function serveWeb(options: ParsedOptions = {}) {
  const start = Date.now()
  console.log(chalk.italic.dim('Starting Web Server...'))

  const distIndexExists = await fs.pathExists(
    path.join(getPaths().web.dist, 'index.html')
  )
  if (!distIndexExists) {
    throw new Error(
      'no built files to serve; run `yarn rw build web` before serving web'
    )
  }

  options.host ??= process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'
  if (process.env.NODE_ENV === 'production' && options.host !== '0.0.0.0') {
    console.warn(
      `Warning: host '${options.host}' may need to be '0.0.0.0' in production`
    )
  }

  const fastify = Fastify({
    requestTimeout: 15_000,
    logger: {
      level:
        process.env.LOG_LEVEL ?? process.env.NODE_ENV === 'development'
          ? 'debug'
          : 'warn',
    },
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
