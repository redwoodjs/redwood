import fs from 'fs'
import path from 'path'

import express from 'express'
import type { Application } from 'express'

import { getPaths } from '@redwoodjs/internal'

const withWebServer = (app: Application) => {
  const indexContent = fs.readFileSync(
    path.join(getPaths().web.dist, '/index.html'),
    'utf-8'
  )

  app.use(
    express.static(getPaths().web.dist, {
      redirect: false,
    })
  )

  // For SPA routing on unmatched routes
  app.get('*', function (_, response) {
    response.send(indexContent)
  })

  return app
}

export default withWebServer
