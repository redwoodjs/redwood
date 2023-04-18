import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { JSONDefinition, JSONResolver } from 'graphql-scalars'
import { createYoga, createSchema } from 'graphql-yoga'

import { authProvider, generateAuthHeaders } from '../services/auth'
import { spanTypeTimeline } from '../services/charts'
import { studioConfig, webConfig } from '../services/config'
import { span, spans } from '../services/explore/span'
import { traces, trace, traceCount } from '../services/explore/trace'
import { prismaQuerySpans } from '../services/prismaSpans'
import { retypeSpans } from '../services/span'
import {
  getFeaturesFromAncestors,
  getFeaturesFromDescendants,
} from '../services/util'

export const setupYoga = (fastify: FastifyInstance) => {
  const schema = createSchema<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    typeDefs: /* GraphQL */ `
      ${JSONDefinition}

      # Feature
      type Feature {
        id: String
        type: String
        brief: String
      }

      # HTTP
      type HttpSpan {
        id: String!
        span: Span
      }

      # GraphQL
      type GraphQLSpan {
        id: String!
        span: Span
      }

      # Traces
      type Trace {
        id: String
        spans: [Span]
        features: [Feature]
      }

      # Spans
      type Span {
        # From OTEL
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
        events: [JSON]
        attributes: JSON
        resources: JSON

        # Enrichments
        type: String
        brief: String
        descendantFeatures: [Feature]
        ancestorFeatures: [Feature]
      }

      type SpanTypeTimelineData {
        data: [JSON]
        keys: [String!]
        index: String
        legend: JSON
        axisLeft: JSON
        axisBottom: JSON
      }

      type PrismaQuerySpan {
        id: String
        trace: String
        parent_id: String
        parent_trace: String
        name: String
        method: String
        model: String
        prisma_name: String
        start_nano: String
        end_nano: String
        duration_nano: String
        duration_ms: String
        duration_sec: String
        db_statement: String
      }

      type GraphQLSpan {
        id: String
        parent: String
        name: String
        field_name: String
        type_name: String
        start_nano: String
        end_nano: String
        duration_nano: String
      }

      type GraphiQLConfig {
        endpoint: String
        authImpersonation: AuthImpersonationConfig
      }

      type AuthImpersonationConfig {
        authProvider: String
        userId: String
        email: String
        roles: [String]
        jwtSecret: String
      }

      type StudioConfig {
        inMemory: Boolean
        graphiql: GraphiQLConfig
      }

      type WebConfig {
        graphqlEndpoint: String
      }

      type AuthHeaders {
        authProvider: String
        cookie: String
        authorization: String
      }

      type Query {
        prismaQueries(id: String!): [PrismaQuerySpan]!
        authProvider: String
        studioConfig: StudioConfig
        webConfig: WebConfig
        generateAuthHeaders(userId: String): AuthHeaders

        # Explore - Tracing
        traceCount: Int
        trace(traceId: String): Trace
        traces: [Trace]

        # Explore - Span
        span(spanId: String!): Span
        spans: [Span]

        # Charts
        spanTypeTimeline(
          timeLimit: Int!
          timeBucket: Int!
        ): SpanTypeTimelineData
      }

      type Mutation {
        retypeSpans: Boolean!
      }
    `,
    resolvers: {
      JSON: JSONResolver,
      Mutation: {
        retypeSpans,
      },
      Query: {
        studioConfig,
        webConfig,
        authProvider,
        generateAuthHeaders,
        prismaQueries: prismaQuerySpans,
        // Explore - Tracing
        traceCount,
        trace,
        traces,
        // Explore - Span
        span,
        spans,
        // Charts
        spanTypeTimeline,
      },
      Span: {
        descendantFeatures: async (span, _args, _ctx) => {
          return getFeaturesFromDescendants(span.id)
        },
        ancestorFeatures: async (span, _args, _ctx) => {
          return getFeaturesFromAncestors(span.id)
        },
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
