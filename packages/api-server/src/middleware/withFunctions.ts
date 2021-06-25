import path from 'path'

import type { Handler } from 'aws-lambda'
import bodyParser from 'body-parser'
import chokidar from 'chokidar'
import type { Application, Request, Response } from 'express'
import glob from 'glob'
import escape from 'lodash.escape'

import { getPaths } from '@redwoodjs/internal'

import { requestHandler } from '../requestHandlers/awsLambda'

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

const withFunctions = (app: Application, apiRootPath: string) => {
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

  console.log('Importing API... ')
  const ts = Date.now()

  loadFunctionsFromDist()

  console.log('Imported in', Date.now() - ts, 'ms')

  if (process.env.NODE_ENV === 'development') {
    console.log(':: Enabling api server hotreload ::')
    // Wait for first run, because babel may still be building
    setTimeout(startFunctionHotReloader, 2000)
  }

  app.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  app.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)

  return app
}

function loadFunctionsFromDist() {
  const rwjsPaths = getPaths()

  const apiFunctions = glob.sync('dist/functions/*.{ts,js}', {
    cwd: rwjsPaths.api.base,
    absolute: true,
  })

  setLambdaFunctions(apiFunctions)
}

function startFunctionHotReloader() {
  let chokidarReady = false
  const rwjsPaths = getPaths()

  chokidar
    .watch(rwjsPaths.api.dist, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: true,
      ignored: (file: string) =>
        file.includes('node_modules') ||
        ['.map', '.d.ts'].some((ext) => file.endsWith(ext)),
    })
    .on('ready', async () => {
      chokidarReady = true
    })
    .on('all', async (_eventName, filePath) => {
      if (!chokidarReady) {
        return
      }

      const reloadTimestamp = Date.now()
      console.log(`Detected change in ${filePath}`)
      console.log('Hot reloading API...')

      Object.keys(require.cache).forEach((cacheKey) => {
        delete require.cache[cacheKey]
      })

      // delete require.cache[filePath]

      loadFunctionsFromDist()
      console.log('Reloaded in', Date.now() - reloadTimestamp, 'ms')
    })
}

export default withFunctions
