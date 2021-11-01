import 'fastify-url-data'
import 'fastify-raw-body'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Handler,
} from 'aws-lambda'
import qs from 'qs'

import { handleError } from '../error'

type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}

export const parseBody = (rawBody: string | Buffer): ParseBodyResult => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

const lambdaEventForFastifyRequest = (
  request: FastifyRequest
): APIGatewayProxyEvent => {
  return {
    httpMethod: request.method,
    headers: request.headers,
    path: request.urlData('path'),
    queryStringParameters: qs.parse(request.url.split(/\?(.+)/)[1]),
    requestContext: {
      identity: {
        sourceIp: request.ip,
      },
    },
    ...parseBody(request.rawBody || ''), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent
}

const fastifyResponseForLambdaResult = (
  fastifyResFn: FastifyReply,
  lambdaResult: APIGatewayProxyResult
) => {
  const { statusCode = 200, headers, body = '' } = lambdaResult

  if (headers) {
    Object.keys(headers).forEach((headerName) => {
      const headerValue: any = headers[headerName]
      fastifyResFn.header(headerName, headerValue)
    })
  }
  fastifyResFn.status(statusCode)

  // We're using this to log GraphQL errors, this isn't the right place.
  // I can't seem to get the express middleware to play nicely.
  if (statusCode === 400) {
    try {
      const b = JSON.parse(body)
      if (b?.errors?.[0]) {
        const { message } = b.errors[0]
        const e = new Error(message)
        e.stack = ''
        handleError(e).then(console.error)
      }
    } catch (e) {
      // do nothing
    }
  }

  if (lambdaResult.isBase64Encoded) {
    // Correctly handle base 64 encoded binary data. See
    // https://aws.amazon.com/blogs/compute/handling-binary-data-using-amazon-api-gateway-http-apis
    fastifyResFn.send(Buffer.from(body, 'base64'))
  } else {
    fastifyResFn.send(body)
  }
}

const fastifyResponseForLambdaError = (
  fastifyResFn: FastifyReply,
  error: Error
) => {
  handleError(error).then(console.log)
  fastifyResFn.status(500).send()
}

export const requestHandler = async (
  req: FastifyRequest,
  res: FastifyReply,
  handler: Handler
) => {
  // We take the fastify request object and convert it into a lambda function event.
  const event = lambdaEventForFastifyRequest(req)

  const handlerCallback =
    (fastifyResFn: FastifyReply) =>
    (error: Error, lambdaResult: APIGatewayProxyResult) => {
      if (error) {
        fastifyResponseForLambdaError(fastifyResFn, error)
        return
      }

      fastifyResponseForLambdaResult(fastifyResFn, lambdaResult)
    }

  // Execute the lambda function.
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
  const handlerPromise = handler(
    event,
    // @ts-expect-error - Add support for context: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0bb210867d16170c4a08d9ce5d132817651a0f80/types/aws-lambda/index.d.ts#L443-L467
    {},
    handlerCallback(res)
  )

  // In this case the handlerCallback should not be called.
  if (handlerPromise && typeof handlerPromise.then === 'function') {
    try {
      const lambaResponse = await handlerPromise
      return fastifyResponseForLambdaResult(res, lambaResponse)
    } catch (error: any) {
      return fastifyResponseForLambdaError(res, error)
    }
  }
}
