import fs from 'fs'
import path from 'path'

import express from 'express'
import type { Application } from 'express'

import { getPaths, findPrerenderedHtml } from '@redwoodjs/internal'

type HtmlContents = {
  [path: string]: string
}

const getFallbackIndexContent = () => {
  const defaultIndexPath = path.join(getPaths().web.dist, '/index.html')
  const prerenderIndexPath = path.join(getPaths().web.dist, '/200.html')

  // If 200 exists: project has been prerendered
  // If 200 doesn't exist: fallback to default index.html
  if (fs.existsSync(prerenderIndexPath)) {
    return fs.readFileSync(prerenderIndexPath)
  } else {
    return fs.readFileSync(defaultIndexPath)
  }
}

const withWebServer = (app: Application) => {
  const files = findPrerenderedHtml()
  const indexContent = getFallbackIndexContent()

  const htmlContentsByPath: HtmlContents = files.reduce(
    (acc, fileName) => ({
      ...acc,
      // TODO find something better in fs
      [fileName.split('.')[0]]: fs.readFileSync(
        path.join(getPaths().web.dist, `${fileName}`),
        'utf-8'
      ),
    }),
    {}
  )

  // For SPA routing on unmatched routes
  Object.keys(htmlContentsByPath).forEach((pathName) => {
    app.get(`/${pathName}`, function (_, response) {
      response.set('Content-Type', 'text/html; charset=UTF-8')
      response.send(htmlContentsByPath[pathName])
    })
  })

  app.use(
    express.static(getPaths().web.dist, {
      redirect: false,
    })
  )

  // For SPA routing fallback on unmatched routes
  // And let JS routing take over
  app.get('*', function (_, response) {
    response.set('Content-Type', 'text/html; charset=UTF-8')
    response.send(indexContent)
  })

  return app
}

export default withWebServer
