import { Response, Request } from 'express'
import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import qs from 'qs'

export const parseBody = (rawBody: string | Buffer) => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

const lambdaEventForExpressRequest = (
  request: Request
): APIGatewayProxyEvent => {
  return {
    httpMethod: request.method,
    headers: request.headers,
    path: request.path,
    queryStringParameters: qs.parse(request.url.split(/\?(.+)/)[1]),
    ...parseBody(request.body), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent
}

const expressResponseForLambdaResult = (
  expressResFn: Response,
  lambdaResult: APIGatewayProxyResult
) => {
  // The response object must be compatible with JSON.stringify according
  // to the aws lambda docs, but the type definition specifies that it has
  // to be a string. Let's double check this.
  const { statusCode = 200, headers, body = '' } = lambdaResult
  if (headers) {
    Object.keys(headers).forEach((headerName) => {
      const headerValue: any = headers[headerName]
      expressResFn.setHeader(headerName, headerValue)
    })
  }
  expressResFn.statusCode = statusCode
  return expressResFn.end(
    typeof body === 'string' ? body : JSON.stringify(body)
  )
}

const expressResponseForLambdaError = (
  expressResFn: Response,
  error: Error
) => {
  console.error(error)
  expressResFn.status(500).send(error)
}

export const requestHandler = async (
  req: Request,
  res: Response,
  lambdaFunction?: any
) => {
  const { routeName } = req.params

  const { handler } = lambdaFunction

  if (typeof handler !== 'function') {
    const errorMessage = `"${routeName}" does not export a function named "handler"`
    console.error(errorMessage)
    return res.status(500).send(errorMessage)
  }

  //We take the express request object and convert it into a lambda function event.

  const event = lambdaEventForExpressRequest(req)

  const handlerCallback = (expressResFn: Response) => (
    error: Error,
    lambdaResult: APIGatewayProxyResult
  ) => {
    if (error) {
      return expressResponseForLambdaError(expressResFn, error)
    }
    return expressResponseForLambdaResult(expressResFn, lambdaResult)
  }

  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
  // Execute the lambda function.
  const handlerPromise = handler(
    event,
    {}, // TODO: Add support for context: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0bb210867d16170c4a08d9ce5d132817651a0f80/types/aws-lambda/index.d.ts#L443-L467
    handlerCallback(res)
  )

  // In this case the handlerCallback should not be called.
  if (handlerPromise && typeof handlerPromise.then === 'function') {
    try {
      const lambaResponse = await handlerPromise
      return expressResponseForLambdaResult(res, lambaResponse)
    } catch (error) {
      return expressResponseForLambdaError(res, error)
    }
  }
}
