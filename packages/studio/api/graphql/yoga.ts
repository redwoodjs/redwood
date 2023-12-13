import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import { JSONDefinition, JSONResolver } from 'graphql-scalars'
import { createYoga, createSchema } from 'graphql-yoga'

import { authProvider, generateAuthHeaders } from '../services/auth'
import {
  spanTypeTimeline,
  spanTreeMapData,
  spanTypeTimeSeriesData,
} from '../services/charts'
import { studioConfig, webConfig } from '../services/config'
import { span, spans } from '../services/explore/span'
import { traces, trace, traceCount } from '../services/explore/trace'
import { seriesTypeBarList, modelsAccessedList } from '../services/lists'
import {
  mails,
  truncate as truncateMails,
  getMailRenderers as mailRenderers,
  getMailTemplates as mailTemplates,
  getMailComponents as mailComponents,
  getRenderedMail as mailRenderedMail,
} from '../services/mail'
import { prismaQuerySpans } from '../services/prismaSpans'
import { retypeSpans, truncateSpans } from '../services/span'
import { getAncestorSpans, getDescendantSpans } from '../services/util'

export const setupYoga = (fastify: FastifyInstance) => {
  const schema = createSchema<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    typeDefs: /* GraphQL */ `
      ${JSONDefinition}

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
        descendantSpans: [Span]
        ancestorSpans: [Span]
      }

      type SpanTypeTimelineData {
        data: [JSON]
        keys: [String!]
        index: String
        legend: JSON
        axisLeft: JSON
        axisBottom: JSON
      }

      # Charts - Line Time Series
      type TimeSeriesType {
        ts: String!
        generic: Float
        graphql: Float
        http: Float
        prisma: Float
        redwoodfunction: Float
        redwoodservice: Float
        sql: Float
      }

      # Lists - Series Type Lists
      type SeriesTypeList {
        series_type: String!
        series_name: String
        quantity: Int!
      }

      type ModelsAccessedList {
        model: String!
        model_count: Int!
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

      # Mail
      type Mail {
        id: String
        data: JSON
        envelope: JSON
        created_at: Int
      }
      type MailTemplate {
        id: Int!
        name: String!
        path: String!
        updatedAt: Int!
      }
      type MailRenderer {
        id: Int!
        name: String!
        isDefault: Boolean!
        updatedAt: Int!
      }
      type MailTemplateComponent {
        id: Int!
        mailTemplateId: Int!
        name: String!
        propsTemplate: String
        updatedAt: Int!
      }
      type RenderedMail {
        html: String
        text: String
        error: String
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
        traces(searchFilter: String): [Trace]

        # Explore - Span
        span(spanId: String!): Span
        spans(searchFilter: String): [Span]

        # Charts
        spanTypeTimeline(
          timeLimit: Int!
          timeBucket: Int!
        ): SpanTypeTimelineData
        spanTypeTimeSeriesData(timeLimit: Int!): [TimeSeriesType]

        # Lists
        seriesTypeBarList(timeLimit: Int!): [SeriesTypeList]
        modelsAccessedList(timeLimit: Int!): [ModelsAccessedList]

        # Maps
        spanTreeMapData(spanId: String): JSON

        # Mail
        mails: [Mail]
        mailTemplates: [MailTemplate]
        mailRenderers: [MailRenderer]
        mailComponents: [MailTemplateComponent]
        mailRenderedMail(
          componentId: Int!
          rendererId: Int!
          propsJSON: String
        ): RenderedMail
      }

      type Mutation {
        retypeSpans: Boolean!
        truncateSpans: Boolean!
        truncateMails: Boolean!
      }
    `,
    resolvers: {
      JSON: JSONResolver,
      Mutation: {
        retypeSpans,
        truncateSpans,
        truncateMails,
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
        spanTypeTimeSeriesData,
        // Lists
        modelsAccessedList,
        seriesTypeBarList,
        // Maps
        spanTreeMapData,
        // Mail
        mails,
        mailTemplates,
        mailRenderers,
        mailComponents,
        mailRenderedMail,
      },
      Span: {
        descendantSpans: async (span, _args, _ctx) => {
          return getDescendantSpans(span.id)
        },
        ancestorSpans: async (span, _args, _ctx) => {
          return getAncestorSpans(span.id)
        },
      },
    },
  })

  const yoga = createYoga<
    {
      req: FastifyRequest
      reply: FastifyReply
    },
    Record<string, unknown>
  >({
    schema,
    logging: {
      debug: (...args) => args.forEach((arg) => fastify.log.debug(arg)),
      info: (...args) => args.forEach((arg) => fastify.log.info(arg)),
      warn: (...args) => args.forEach((arg) => fastify.log.warn(arg)),
      error: (...args) => args.forEach((arg) => fastify.log.error(arg)),
    },
    graphiql: true,
  })

  return yoga
}
