import fastifyUrlData from '@fastify/url-data'
import type { APIGatewayProxyEvent } from 'aws-lambda'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import type { FastifyRequest } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import qs from 'qs'

import type {
  GraphQLYogaOptions,
  GlobalContext,
} from '@redwoodjs/graphql-server'
import {
  createGraphQLYoga,
  getAsyncStoreInstance,
} from '@redwoodjs/graphql-server'

/**
 * Redwood GraphQL Server Fastify plugin based on GraphQL Yoga
 *
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {GraphQLYogaOptions} options GraphQLYogaOptions options used to configure the GraphQL Yoga Server
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: GraphQLYogaOptions,
  done: HookHandlerDoneFunction
) {
  // These two plugins are needed to transform a Fastify Request to a Lambda event
  // which is used by the RedwoodGraphQLContext and mimics the behavior of the
  // api-server withFunction plugin
  fastify.register(fastifyUrlData)
  await fastify.register(fastifyRawBody)

  try {
    const { yoga } = createGraphQLYoga(options)

    // TODO: This should be refactored to only be defined once and it might not live here
    // Ensure that each request has a unique global context
    fastify.addHook('onRequest', (_req, _reply, done) => {
      getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
    })

    fastify.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await yoga.handleNodeRequest(req, {
          req,
          reply,
          event: lambdaEventForFastifyRequest(req),
          requestContext: {},
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

function lambdaEventForFastifyRequest(
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

function parseBody(rawBody: string | Buffer): ParseBodyResult {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

type ParseBodyResult = {
  body: string
  isBase64Encoded: boolean
}
