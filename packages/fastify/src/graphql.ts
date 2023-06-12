import fastifyUrlData from '@fastify/url-data'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import { createGraphQLYoga } from '@redwoodjs/graphql-server'
import type { GraphQLYogaOptions } from '@redwoodjs/graphql-server'

/**
 * Transform a Fastify Request to an event compatible with the RedwoodGraphQLContext's event
 * which is based on the AWS Lambda event
 */
import { lambdaEventForFastifyRequest as transformToRedwoodGraphQLContextEvent } from './lambda/index'

/**
 * Redwood GraphQL Server Fastify plugin based on GraphQL Yoga
 *
 * Important: Need to set DISABLE_CONTEXT_ISOLATION = 1 in environment variables
 * so that global context is populated correctly and features such as authentication
 * works properly.
 *
 * It is critical to set shouldUseLocalStorageContext correctly so that the `setContext` function
 * in the `useRedwoodPopulateContext` plugin sets the global context correctly with any
 * extended GraphQL context as is done with `useRedwoodAuthContext` that sets
 * the `currentUser` in the context when used to authenticate a user.
 *
 * See: packages/graphql-server/src/globalContext.ts
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

    fastify.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await yoga.handleNodeRequest(req, {
          req,
          reply,
          event: transformToRedwoodGraphQLContextEvent(req),
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
