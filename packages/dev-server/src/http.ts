import type { Response, Request } from 'express'
import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'

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
  app.use(bodyParser.raw({ type: '*/*' }))
  app.use(morgan('dev'))

  app.all('/', (_, res) => {
    return res.send(`
      <p>The following serverless Functions are available:</p>
      <ol>
        ${Object.keys(LAMBDA_FUNCTIONS)
          .sort()
          .map((name) => `<li><a href="/${name}">/${name}</a></li>`)
          .join()}
      </ol>
    `)
  })

  app.all(
    '/:routeName',
    async (req: Request, res: Response): Promise<void> => {
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
  )

  return app
}
