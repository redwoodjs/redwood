import express from 'express'
import type { Response, Request, Application } from 'express'
import Fastify, { FastifyInstance } from 'fastify'
import morgan from 'morgan'

// Base express app, with common config
const createApp = (): Application => {
  const app = express()

  // Add common middleware
  app.use(morgan<Request, Response>('dev'))

  return app
}

export const createFastifyInstance = (): FastifyInstance => {
  const app = Fastify({
    logger: { prettyPrint: process.env.NODE_ENV !== 'production' },
  })

  return app
}

export default createApp
