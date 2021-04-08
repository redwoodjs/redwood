import fs from 'fs'
import path from 'path'

import type { Handler } from 'aws-lambda'
import bodyParser from 'body-parser'
import type { Response, Request } from 'express'
import express from 'express'
import glob from 'glob'
import { createProxyMiddleware } from 'http-proxy-middleware'
import escape from 'lodash.escape'
import morgan from 'morgan'

import { getPaths } from '@redwoodjs/internal'

import { requestHandler } from './requestHandlers/awsLambda'

const rwjsPaths = getPaths()

export type Lambdas = Record<string, Handler>
const LAMBDA_FUNCTIONS: Lambdas = {}
export const setLambdaFunctions = (foundFunctions: string[]) => {
  for (const fnPath of foundFunctions) {
    const routeName = path.basename(fnPath).replace('.js', '')
    const { handler } = require(fnPath)
    LAMBDA_FUNCTIONS[routeName] = handler
    if (!handler) {
      console.warn(
        routeName,
        'at',
        fnPath,
        'does not have a function called handler defined.'
      )
    }
  }
}

const lambdaRequestHandler = async (req: Request, res: Response) => {
  const { routeName } = req.params
  if (!LAMBDA_FUNCTIONS[routeName]) {
    const errorMessage = `Function "${routeName}" was not found.`
    console.error(errorMessage)
    res.status(404).send(escape(errorMessage))
    return
  }
  return requestHandler(req, res, LAMBDA_FUNCTIONS[routeName])
}

export interface HttpServerParams {
  port: number
  socket?: string
  apiRootPath?: string
  apiHost?: string
  serveWeb?: boolean
}

export const http = ({
  port = 8911,
  socket,
  apiRootPath,
  apiHost,
  serveWeb,
}: HttpServerParams) => {
  const app = express()

  app.use(morgan<Request, Response>('dev'))

  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    const apiProxyPath = apiRootPath as string
    app.use(
      createProxyMiddleware(apiProxyPath, {
        changeOrigin: true,
        pathRewrite: {
          [`^${apiProxyPath}`]: '/', // remove base path
        },
        target: apiHost,
      })
    )
  } else {
    app.use(
      bodyParser.text({
        type: ['text/*', 'application/json', 'multipart/form-data'],
      })
    )

    app.use(
      bodyParser.raw({
        type: '*/*',
        limit: process.env.BODY_PARSER_LIMIT,
      })
    )

    app.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
    app.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)
  }

  // Put this at the bottom so other routes match first
  if (serveWeb) {
    app.use(
      express.static(getPaths().web.dist, {
        redirect: false,
      })
    )

    // For SPA routing
    app.get('*', function (_, response) {
      response.sendFile(path.join(getPaths().web.dist, '/index.html'))
    })
  }

  const server = app
    .listen(socket || port, () => {
      const ts = Date.now()
      if (!apiHost) {
        console.log('Importing API... ')
        const apiFunctions = glob.sync('dist/functions/*.{ts,js}', {
          cwd: rwjsPaths.api.base,
          absolute: true,
        })
        setLambdaFunctions(apiFunctions)
        console.log('Imported in', Date.now() - ts, 'ms')
      }
    })
    .on('close', () => {
      if (socket) {
        fs.rmSync(socket)
      }
    })

  return server
}
