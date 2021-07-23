import fs from 'fs'
import path from 'path'

import express from 'express'
import type { Application } from 'express'

import { getPaths } from '@redwoodjs/internal'

type Contents = {
  [content: string]: string
}
const withWebServer = (app: Application) => {
  const files = fs.readdirSync(getPaths().web.dist)
    .filter(file => file.split('.')[1] === 'html')
    .map(file => file.split('.')[0])

  const contents: Contents = files.reduce((acc, cur) => ({
      ...acc,
      [cur]: fs.readFileSync(
        path.join(getPaths().web.dist, `/${cur}.html`),
        'utf-8'
      )
  }), {})

  app.use(
    express.static(getPaths().web.dist, {
      redirect: false,
    })
  )

  // For SPA routing on unmatched routes
  Object.keys(contents).forEach((content) => {
    app.get(`/${content}`, function (_, response) {
      response.send(contents[content])
    })
  })

  return app
}

export default withWebServer
