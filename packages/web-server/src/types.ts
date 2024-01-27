import type { FastifyServerOptions } from 'fastify'

import type { RedwoodFastifyWebOptions } from '@redwoodjs/fastify-web'

export type ServeWebOptions = {
  logger?: FastifyServerOptions['logger']
  port?: number
  host?: string
} & RedwoodFastifyWebOptions['redwood']

export type ParsedOptions = Omit<ServeWebOptions, 'logger'>
