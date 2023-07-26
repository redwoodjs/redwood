#!/usr/bin/env node

// For @redwoodjs/cli.

import chalk from 'chalk'

import { withApiProxy, createFastifyInstance } from '@redwoodjs/fastify-shared'
import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import { getConfig } from '@redwoodjs/project-config'

import { Options } from './types'

export async function handler(options: Options) {
  const startTime = Date.now()

  const redwoodConfig = getConfig()

  const port = options.port ? parseInt(options.port) : redwoodConfig.web.port
  const apiUrl = redwoodConfig.web.apiUrl

  console.log(chalk.italic.dim('Starting Web Server...'))

  // MARK: So that this isn't breaking yet, we respect the server.config.js file.
  const fastify = createFastifyInstance()

  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  // TODO: Could this be folded into redwoodFastifyWeb?
  // If apiHost is supplied, it means the functions are running elsewhere, so we should just proxy requests.
  if (options.apiHost) {
    // Attach plugin for proxying
    fastify.register(withApiProxy, { apiHost: options.apiHost, apiUrl })
  }

  let listenOptions:
    | { path: string; port?: never; host?: never }
    | { path?: never; port?: number; host?: string }

  if (options.socket) {
    listenOptions = { path: options.socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  // Start
  fastify.listen(listenOptions)

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - startTime) + ' ms'))
    if (options.socket) {
      console.log(`Web server started on ${options.socket}`)
    } else {
      console.log(`Web server started on http://localhost:${port}`)
    }
  })

  // FIXME: No call to sendProcessReady() here when there should be

  process.on('exit', () => {
    // FIXME: This returns a promise which is forbidden because the 'exit' event handlers can't be async
    fastify.close()
  })
}
