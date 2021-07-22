import express from 'express'
import type { Response, Request, Application } from 'express'
import morgan from 'morgan'

// Base express app, with common config
const createApp = (): Application => {
  const app = express()

  // Add common middleware
  app.use(morgan<Request, Response>('dev'))

  return app
}

export default createApp
