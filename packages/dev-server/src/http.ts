import bodyParser from 'body-parser'
import type { Response, Request } from 'express'
import express from 'express'
import morgan from 'morgan'
import supertokens from "supertokens-node";
import emailpassword from "supertokens-node/recipe/emailpassword";
import sessions from "supertokens-node/recipe/session";

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

  supertokens.init({
    appInfo: {
      apiDomain: "http://localhost:8910/",
      appName: "SuperTokens RedwoodJS",
      websiteDomain: "http://localhost:8910/"
    },
    supertokens: {
      connectionURI: "try.supertokens.io"
    },
    recipeList: [
      emailpassword.init(),
      sessions.init()
    ]
  });

  const app = express()
  app.use(
    bodyParser.text({
      type: ['text/*', 'application/json', 'multipart/form-data'],
    })
  )
  app.use(bodyParser.raw({ type: '*/*', limit: process.env.BODY_PARSER_LIMIT }))
  app.use(morgan<Request, Response>('dev'))

  app.use(supertokens.middleware());

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

  app.use(supertokens.errorHandler())

  return app
}
