import fs from 'fs'
import path from 'path'

import type { Handler } from 'aws-lambda'
import bodyParser from 'body-parser'
import type { Response, Request } from 'express'
import express from 'express'
import glob from 'glob'
import morgan from 'morgan'

import { getPaths } from '@redwoodjs/internal'
const rwjsPaths = getPaths()

import { requestHandler } from './requestHandlers/awsLambda'

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
    res.status(404).send(errorMessage)
    return
  }
  return requestHandler(req, res, LAMBDA_FUNCTIONS[routeName])
}

export const http = ({
  port = 8911,
  socket,
}: {
  port: number
  socket?: string
}) => {
  const app = express()

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

  app.use(morgan<Request, Response>('dev'))

  app.all('/:routeName', lambdaRequestHandler)
  app.all('/:routeName/*', lambdaRequestHandler)

  const server = app
    .listen(socket || port, () => {
      const ts = Date.now()
      console.log('Importing API... ')
      const apiFunctions = glob.sync('dist/functions/*.{ts,js}', {
        cwd: rwjsPaths.api.base,
        absolute: true,
      })
      setLambdaFunctions(apiFunctions)
      console.log('Imported in', Date.now() - ts, 'ms')
    })
    .on('close', () => {
      if (socket) {
        fs.rmSync(socket)
      }
    })

  return server
}
