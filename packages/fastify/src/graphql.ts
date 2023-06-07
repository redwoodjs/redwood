import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import * as fastUri from 'fast-uri'
import type {
  FastifyInstance,
  HookHandlerDoneFunction,
  FastifyRequest,
} from 'fastify'
import qs from 'qs'

import type { GraphQLYogaOptions } from '@redwoodjs/graphql-server'
import { createGraphQLYoga } from '@redwoodjs/graphql-server'

type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}

const parseBody = (rawBody: string | Buffer): ParseBodyResult => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

const parseRequest = (request: FastifyRequest) => {
  const scheme = request.headers[':scheme']
    ? request.headers[':scheme']
    : request.protocol
  const host = request.hostname
  const requestPath = request.headers[':path'] || request.raw.url
  const path = fastUri.parse(scheme + '://' + host + requestPath).path
  const queryStringParameters = qs.parse(request.url.split(/\?(.+)/)[1])
  const httpMethod = request.method
  const headers = request.headers
  return {
    headers,
    httpMethod,
    scheme,
    host,
    requestPath,
    path,
    queryStringParameters,
  }
}

const lambdaEventForFastifyRequest = (
  request: FastifyRequest
): APIGatewayProxyEvent => {
  const { headers, httpMethod, path, queryStringParameters } =
    parseRequest(request)
  return {
    httpMethod,
    headers,
    path,
    queryStringParameters,
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
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: GraphQLYogaOptions,
  done: HookHandlerDoneFunction
) {
  try {
    const { yoga } = createGraphQLYoga(options)

    fastify.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const event = lambdaEventForFastifyRequest(req)
        console.debug('event', event)

        const response = await yoga.handleNodeRequest(req, {
          req,
          reply,
          event,
          // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
          requestContext: {} as LambdaContext,
        })

        for (const [name, value] of response.headers) {
          reply.header(name, value)
        }

        reply.status(response.status)
        reply.send(response.body)

        return reply
      },
    })

    fastify.ready(() => {
      console.log(`GraphQL Yoga Server endpoint at ${yoga.graphqlEndpoint}`)
    })

    done()
  } catch (e) {
    console.log(e)
  }
}
