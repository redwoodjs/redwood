import { Response, Request } from 'express'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'

import { requestHandler } from './awsLambdaRequestHandler'

export interface Lambdas {
  [path: string]: any
}
let LAMBDA_FUNCTIONS: Lambdas = {}
export const setLambdaFunctions = (functions: Lambdas): void => {
  LAMBDA_FUNCTIONS = functions
}

export const server = (): any => {
  const app = express()
  app.use(
    bodyParser.text({
      type: ['text/*', 'application/json', 'multipart/form-data'],
    })
  )
  app.use(bodyParser.raw({ type: '*/*' }))
  app.use(morgan('dev'))

  app.all('/', (_, res) => {
    return res.send(`
      <p>The following lambda functions are available:</p>
      <ol>
        ${Object.keys(LAMBDA_FUNCTIONS)
          .sort()
          .map((name) => `<li><a href="/${name}">/${name}</a></li>`)}
      </ol>
    `)
  })

  app.all('/:routeName', async (req: Request, res: Response) => {
    const { routeName } = req.params

    const lambdaFunction = LAMBDA_FUNCTIONS[routeName]
    if (!lambdaFunction) {
      const errorMessage = `route "${routeName}" not found`
      console.error(errorMessage)
      return res.status(404).send(errorMessage)
    }
    await requestHandler(req, res, lambdaFunction)
  })

  return app
}
