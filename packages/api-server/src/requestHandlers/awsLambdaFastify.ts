import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Handler,
} from 'aws-lambda'
import type { FastifyRequest, FastifyReply } from 'fastify'
import qs from 'qs'

type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}

type FastifyLambdaHeaders =
  | { [header: string]: string | number | boolean }
  | undefined
type FastifyLambdaMultiValueHeaders =
  | {
      [header: string]: (string | number | boolean)[]
    }
  | undefined

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
      requestId: request.id,
      identity: {
        sourceIp: request.ip,
      },
    },
    ...parseBody(request.rawBody || ''), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent
}

/**
 * The header keys are case insensitive, but Fastify prefers these to be lowercase.
 * Therefore, we want to ensure that the headers are always lowercase and unique
 * for compliance with HTTP/2.
 *
 * @see: https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2
 *
 * Just as in HTTP/1.x, header field names are strings of ASCII
 * characters that are compared in a case-insensitive fashion.  However,
 * header field names MUST be converted to lowercase prior to their
 * encoding in HTTP/2.  A request or response containing uppercase
 * header field names MUST be treated as malformed (Section 8.1.2.6).
 *
 * @see: https://tools.ietf.org/html/rfc2616#section-4.2
 */
const sanitizeHeaders = (
  headers: FastifyLambdaHeaders,
  reply: FastifyReply
) => {
  const headersLowercase = {} as FastifyLambdaHeaders

  if (headers && headersLowercase) {
    reply.headers({})

    Object.keys(headers).forEach((headerName) => {
      headersLowercase[headerName.toLowerCase()] = headers[headerName]
    })

    reply.headers(headersLowercase)
  }
}

/**
 * In case there are multi-value headers that are not in the headers object,
 * we need to add them to the headers object and ensure the header names are lowercase
 * and that if there is an array fo values, they are separated by a semi-colon.
 */
const mergeMultiValueHeaders = (
  multiValueHeaders: FastifyLambdaMultiValueHeaders,
  reply: FastifyReply
) => {
  if (multiValueHeaders) {
    Object.keys(multiValueHeaders).forEach((headerName) => {
      const headerValue: Array<any> = multiValueHeaders[headerName]
      if (!reply.getHeader(headerName.toLowerCase())) {
        reply.header(headerName.toLowerCase(), headerValue.join(';').toString())
      }
    })
  }
}

const fastifyResponseForLambdaResult = (
  reply: FastifyReply,
  lambdaResult: APIGatewayProxyResult
) => {
  const {
    statusCode = 200,
    headers,
    body = '',
    multiValueHeaders,
  } = lambdaResult

  sanitizeHeaders(headers, reply)
  mergeMultiValueHeaders(multiValueHeaders, reply)

  reply.status(statusCode)

  if (lambdaResult.isBase64Encoded) {
    // Correctly handle base 64 encoded binary data. See
    // https://aws.amazon.com/blogs/compute/handling-binary-data-using-amazon-api-gateway-http-apis
    reply.send(Buffer.from(body, 'base64'))
  } else {
    reply.send(body)
  }
}

const fastifyResponseForLambdaError = (
  req: FastifyRequest,
  reply: FastifyReply,
  error: Error
) => {
  req.log.error(error)
  reply.status(500).send()
}

export const requestHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
  handler: Handler
) => {
  // We take the fastify request object and convert it into a lambda function event.
  const event = lambdaEventForFastifyRequest(req)

  const handlerCallback =
    (reply: FastifyReply) =>
    (error: Error, lambdaResult: APIGatewayProxyResult) => {
      if (error) {
        fastifyResponseForLambdaError(req, reply, error)
        return
      }

      fastifyResponseForLambdaResult(reply, lambdaResult)
    }

  // Execute the lambda function.
  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
  const handlerPromise = handler(
    event,
    // @ts-expect-error - Add support for context: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0bb210867d16170c4a08d9ce5d132817651a0f80/types/aws-lambda/index.d.ts#L443-L467
    {},
    handlerCallback(reply)
  )

  // In this case the handlerCallback should not be called.
  if (handlerPromise && typeof handlerPromise.then === 'function') {
    try {
      const lambdaResponse = await handlerPromise
      return fastifyResponseForLambdaResult(reply, lambdaResponse)
    } catch (error: any) {
      return fastifyResponseForLambdaError(req, reply, error)
    }
  }
}
