import bodyParser from 'body-parser'
import express from 'express'
import type { Response, Request } from 'express'
import morgan from 'morgan'

export interface Lambdas {
  [path: string]: any
}
let LAMBDA_FUNCTIONS: Lambdas = {}
export const setLambdaFunctions = (functions: Lambdas): void => {
  LAMBDA_FUNCTIONS = functions
}

export const server = ({
  requestHandler,
}: {
  requestHandler: (req: Request, res: Response, lambdaFunction: any) => void
}): any => {
  const app = express()
  app.use(
    bodyParser.text({
      type: ['text/*', 'application/json', 'multipart/form-data'],
    })
  )
  app.use(bodyParser.raw({ type: '*/*', limit: process.env.BODY_PARSER_LIMIT }))
  app.use(morgan<Request, Response>('dev'))

  app.all('/', (_, res) => {
    return res.send(`
      <p>The following serverless Functions are available:</p>
      <ol>
        ${Object.keys(LAMBDA_FUNCTIONS)
          .sort()
          .map((name) => `<li><a href="${name}">${name}</a></li>`)
          .join('')}
      </ol>
    `)
  })

  const lambdaHandler = async (req: Request, res: Response): Promise<void> => {
    const { routeName } = req.params
    const lambdaFunction = LAMBDA_FUNCTIONS[routeName]
    if (!lambdaFunction) {
      const errorMessage = `Function "${routeName}" was not found.`
      console.error(errorMessage)
      res.status(404).send(errorMessage)
      return
    }
    await requestHandler(req, res, lambdaFunction)
  }

  app.all('/:routeName', lambdaHandler)
  app.all('/:routeName/*', lambdaHandler)

  return app
}
