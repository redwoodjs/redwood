import path from 'path'

import type { Handler } from 'aws-lambda'
import bodyParser from 'body-parser'
import type { Application, Request, Response } from 'express'
import fg from 'fast-glob'
import escape from 'lodash.escape'

import { getPaths } from '@redwoodjs/internal'

import { requestHandler } from '../requestHandlers/awsLambda'

export type Lambdas = Record<string, Handler>
const LAMBDA_FUNCTIONS: Lambdas = {}

const loadFunctionsFromDist = async () => {
  const rwjsPaths = getPaths()
  const apiFunctions = fg.sync('dist/functions/*.{ts,js}', {
    cwd: rwjsPaths.api.base,
    absolute: true,
  })

  await setLambdaFunctions(apiFunctions)
}

// Import the API functions and add them to the LAMBDA_FUNCTIONS object
export const setLambdaFunctions = async (foundFunctions: string[]) => {
  const ts = Date.now()
  console.log('Importing API... ')

  const imports = foundFunctions.map((fnPath) => {
    return new Promise((resolve) => {
      const routeName = path.basename(fnPath).replace('.js', '')
      console.log('  /' + routeName)
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
      return resolve(true)
    })
  })

  Promise.all(imports).then((_results) => {
    console.log('Imported in', Date.now() - ts, 'ms')
  })
}

const lambdaRequestHandler = async (req: Request, res: Response) => {
  const { routeName } = req.params
  if (!LAMBDA_FUNCTIONS[routeName]) {
    const errorMessage = `Function "${routeName}" was not found.`
    console.error(errorMessage)
    res.status(404)

    if (process.env.NODE_ENV === 'development') {
      const devError = {
        error: errorMessage,
        availableFunctions: Object.keys(LAMBDA_FUNCTIONS),
      }
      res.json(devError)
    } else {
      res.send(escape(errorMessage))
    }

    return
  }
  return requestHandler(req, res, LAMBDA_FUNCTIONS[routeName])
}

const withFunctions = async (app: Application, apiRootPath: string) => {
  app.use(
    bodyParser.text({
      type: ['text/*', 'application/json', 'multipart/form-data'],
      limit: process.env.BODY_PARSER_LIMIT,
    })
  )

  app.use(
    bodyParser.raw({
      type: '*/*',
      limit: process.env.BODY_PARSER_LIMIT,
    })
  )

  await loadFunctionsFromDist()

  app.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  app.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)

  return app
}

export default withFunctions
