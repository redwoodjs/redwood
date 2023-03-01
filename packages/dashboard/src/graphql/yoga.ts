import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { createYoga, createSchema } from 'graphql-yoga'

import { traces, trace } from '../services/span'

export const setupYoga = (fastify: FastifyInstance) => {
  const schema = createSchema<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    typeDefs: /* GraphQL */ `
      type Trace {
        id: String
        spans: [Span]
      }
      type Span {
        id: String
        trace: String
        parent: String
        name: String
        kind: Int
        statusCode: Int
        statusMessage: String
        startNano: String
        endNano: String
        durationNano: String
        events: String # JSON
        attributes: String # JSON
        resources: String # JSON
      }
      type Query {
        traces: [Trace]!
        trace(id: String!): Trace
      }
    `,
    resolvers: {
      Query: {
        traces,
        trace,
      },
    },
  })

  const yoga = createYoga<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    schema,
    logging: {
      debug: (...args) => args.forEach((arg) => fastify.log.debug(arg)),
      info: (...args) => args.forEach((arg) => fastify.log.info(arg)),
      warn: (...args) => args.forEach((arg) => fastify.log.warn(arg)),
      error: (...args) => args.forEach((arg) => fastify.log.error(arg)),
    },
  })

  return yoga
}
