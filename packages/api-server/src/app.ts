import express from 'express'
import morgan from 'morgan'

import type { Response, Request, Application } from 'express'

// Base express app, with common config
const createApp = (): Application => {
  const app = express()

  // Add common middleware
  app.use(morgan<Request, Response>('dev'))

  return app
}

export default createApp
