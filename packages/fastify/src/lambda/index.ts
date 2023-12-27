import path from 'node:path'

import c from 'ansi-colors'
import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Handler,
} from 'aws-lambda'
import fg from 'fast-glob'
import type {
  FastifyReply,
  FastifyRequest,
  RequestGenericInterface,
} from 'fastify'
import { escape } from 'lodash'
import qs from 'qs'

import { getPaths } from '@redwoodjs/project-config'

// NOTE: Copied from @redwoodjs/internal/dist/files to avoid depending on @redwoodjs/internal.
// import { findApiDistFunctions } from '@redwoodjs/internal/dist/files'
function findApiDistFunctions(cwd: string = getPaths().api.base) {
  return fg.sync('dist/functions/**/*.{ts,js}', {
    cwd,
    deep: 2, // We don't support deeply nested api functions, to maximise compatibility with deployment providers
    absolute: true,
  })
}

export type Lambdas = Record<string, Handler>
export const LAMBDA_FUNCTIONS: Lambdas = {}

/**
 * Imports the API functions and add them to the LAMBDA_FUNCTIONS object.
 */
export const setLambdaFunctions = async (foundFunctions: string[]) => {
  const tsImport = Date.now()
  console.log(c.italic(c.dim('Importing Server Functions... ')))
  const imports = foundFunctions.map((fnPath) => {
    return new Promise((resolve) => {
      const ts = Date.now()
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
      console.log(
        c.magenta('/' + routeName),
        c.italic(c.dim(Date.now() - ts + ' ms'))
      )
      return resolve(true)
    })
  })

  Promise.all(imports).then((_results) => {
    console.log(
      c.italic(c.dim('...Done importing in ' + (Date.now() - tsImport) + ' ms'))
    )
  })
}

// TODO: Use v8 caching to load these crazy fast.
export const loadFunctionsFromDist = async () => {
  const serverFunctions = findApiDistFunctions()
  // Place `GraphQL` serverless function at the start.
  const i = serverFunctions.findIndex((x) => x.indexOf('graphql') !== -1)
  if (i >= 0) {
    const graphQLFn = serverFunctions.splice(i, 1)[0]
    serverFunctions.unshift(graphQLFn)
  }
  await setLambdaFunctions(serverFunctions)
}

interface LambdaHandlerRequest extends RequestGenericInterface {
  Params: {
    routeName: string
  }
}

/**
 * This converts a Fastify request to a lambdaEvent, and passes it to the the appropriate handler for the routeName.
 * At this point, the LAMBDA_FUNCTIONS lookup has been populated.
 **/
export async function lambdaRequestHandler(
  req: FastifyRequest<LambdaHandlerRequest>,
  reply: FastifyReply
) {
  const { routeName } = req.params

  if (!LAMBDA_FUNCTIONS[routeName]) {
    const errorMessage = `Function "${routeName}" was not found.`
    req.log.error(errorMessage)
    reply.status(404)

    if (process.env.NODE_ENV === 'development') {
      const devError = {
        error: errorMessage,
        availableFunctions: Object.keys(LAMBDA_FUNCTIONS),
      }
      reply.send(devError)
    } else {
      reply.send(escape(errorMessage))
    }

    return
  }
  return requestHandler(req, reply, LAMBDA_FUNCTIONS[routeName])
}

export function lambdaEventForFastifyRequest(
  request: FastifyRequest
): APIGatewayProxyEvent {
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

function fastifyResponseForLambdaResult(
  reply: FastifyReply,
  lambdaResult: APIGatewayProxyResult
) {
  const {
    statusCode = 200,
    headers,
    body = '',
    multiValueHeaders,
  } = lambdaResult
  const mergedHeaders = mergeMultiValueHeaders(headers, multiValueHeaders)
  Object.entries(mergedHeaders).forEach(([name, values]) =>
    values.forEach((value) => reply.header(name, value))
  )
  reply.status(statusCode)

  if (lambdaResult.isBase64Encoded) {
    // Correctly handle base 64 encoded binary data. See
    // https://aws.amazon.com/blogs/compute/handling-binary-data-using-amazon-api-gateway-http-apis
    return reply.send(Buffer.from(body, 'base64'))
  } else {
    return reply.send(body)
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

export async function requestHandler(
  req: FastifyRequest,
  reply: FastifyReply,
  handler: Handler
) {
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

type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}

type FastifyHeaderValue = string | number | boolean

type FastifyMergedHeaders = { [name: string]: FastifyHeaderValue[] }

type FastifyRequestHeader = { [header: string]: FastifyHeaderValue }

type FastifyLambdaHeaders = FastifyRequestHeader | undefined

type FastifyLambdaMultiValueHeaders = FastifyMergedHeaders | undefined

export function parseBody(rawBody: string | Buffer): ParseBodyResult {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

/**
 * `headers` and `multiValueHeaders` are merged into a single object where the
 * key is the header name in lower-case and the value is a list of values for
 * that header. Most multi-values are merged into a single value separated by a
 * semi-colon. The only exception is set-cookie. set-cookie headers should not
 * be merged, they should be set individually by multiple calls to
 * reply.header(). See
 * https://www.fastify.io/docs/latest/Reference/Reply/#set-cookie
 */
export function mergeMultiValueHeaders(
  headers: FastifyLambdaHeaders,
  multiValueHeaders: FastifyLambdaMultiValueHeaders
) {
  const mergedHeaders = Object.entries(
    headers || {}
  ).reduce<FastifyMergedHeaders>((acc, [name, value]) => {
    acc[name.toLowerCase()] = [value]

    return acc
  }, {})

  Object.entries(multiValueHeaders || {}).forEach(([headerName, values]) => {
    const name = headerName.toLowerCase()

    if (name.toLowerCase() === 'set-cookie') {
      mergedHeaders['set-cookie'] = values
    } else {
      mergedHeaders[name] = [values.join('; ')]
    }
  })

  return mergedHeaders
}
