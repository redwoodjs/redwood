/* eslint-disable react-hooks/rules-of-hooks */
import {
  envelop,
  FormatErrorHandler,
  useMaskedErrors,
  useSchema,
  Plugin,
  EnvelopError,
} from '@envelop/core'
import { useDepthLimit, DepthLimitConfig } from '@envelop/depth-limit'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import type { AllowedOperations } from '@envelop/filter-operation-type'
import { useParserCache } from '@envelop/parser-cache'
import { useValidationCache } from '@envelop/validation-cache'
import { mergeSchemas } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  APIGatewayProxyResult,
} from 'aws-lambda'
import { GraphQLError, GraphQLSchema } from 'graphql'
import {
  getGraphQLParameters,
  processRequest,
  Request,
  shouldRenderGraphiQL,
} from 'graphql-helix'
import { renderPlaygroundPage } from 'graphql-playground-html'
import { BaseLogger, LevelWithSilent } from 'pino'

import { AuthContextPayload } from '@redwoodjs/api'

import { CorsConfig, createCorsContext } from '../cors'
import {
  schema as authDirectiveDocumentNodes,
  requireAuth,
  skipAuth,
} from '../directives/authDirectives'
import { getAsyncStoreInstance } from '../globalContext'
import { createHealthcheckContext, OnHealthcheckFn } from '../healthcheck'
import { useRedwoodAuthContext } from '../plugins/useRedwoodAuthContext'
import { useRedwoodDirective } from '../plugins/useRedwoodDirective'
import { useRedwoodGlobalContextSetter } from '../plugins/useRedwoodGlobalContextSetter'
import { useRedwoodLogger } from '../plugins/useRedwoodLogger'
import { useRedwoodPopulateContext } from '../plugins/useRedwoodPopulateContext'

export type GetCurrentUser = (
  decoded: AuthContextPayload[0],
  raw: AuthContextPayload[1],
  req?: AuthContextPayload[2]
) => Promise<null | Record<string, unknown> | string>

export type Context = Record<string, unknown>
export type ContextFunction = (...args: any[]) => Context | Promise<Context>
export type RedwoodGraphQLContext = {
  event: APIGatewayProxyEvent
  // TODO: Maybe this needs a better name?
  context: LambdaContext
}

/**
 * Options for request and response information to include in the log statements
 * output by UseRedwoodLogger around the execution event
 *
 * @param level - Sets log level specific to GraphQL log output. Defaults to current logger level.
 * @param data - Include response data sent to client.
 * @param operationName - Include operation name.
 * @param requestId - Include the event's requestId, or if none, generate a uuid as an identifier.
 * @param query - Include the query. This is the query or mutation (with fields) made in the request.
 * @param tracing - Include the tracing and timing information.
 * @param userAgent - Include the browser (or client's) user agent.
 */
type GraphQLLoggerOptions = {
  /**
   * Sets log level for GraphQL logging.
   * This level setting can be different than the one used in api side logging.
   * Defaults to the same level as the logger unless set here.
   *
   * Available log levels:
   *
   * - 'fatal'
   * - 'error'
   * - 'warn'
   * - 'info'
   * - 'debug'
   * - 'trace'
   * - 'silent'
   *
   * The logging level is a __minimum__ level. For instance if `logger.level` is `'info'` then all `'fatal'`, `'error'`, `'warn'`,
   * and `'info'` logs will be enabled.
   *
   * You can pass `'silent'` to disable logging.
   *
   * @default level of the logger set in LoggerConfig
   *
   */
  level?: LevelWithSilent | string

  /**
   * @description Include response data sent to client.
   */
  data?: boolean

  /**
   * @description Include operation name.
   *
   * The operation name is a meaningful and explicit name for your operation. It is only required in multi-operation documents,
   * but its use is encouraged because it is very helpful for debugging and server-side logging.
   * When something goes wrong (you see errors either in your network logs, or in the logs of your GraphQL server)
   * it is easier to identify a query in your codebase by name instead of trying to decipher the contents.
   * Think of this just like a function name in your favorite programming language.
   *
   * @see https://graphql.org/learn/queries/#operation-name
   */
  operationName?: boolean

  /**
   * @description Include the event's requestId, or if none, generate a uuid as an identifier.
   *
   * The requestId can be helpful when contacting your deployment provider to resolve issues when encountering errors or unexpected behavior.
   */
  requestId?: boolean

  /**
   * @description Include the query. This is the query or mutation (with fields) made in the request.
   */
  query?: boolean

  /**
   * @description Include the tracing and timing information.
   *
   * This will log various performance timings withing the GraphQL event lifecycle (parsing, validating, executing, etc).
   */
  tracing?: boolean

  /**
   * @description Include the browser (or client's) user agent.
   *
   * This can be helpful to know what type of client made the request to resolve issues when encountering errors or unexpected behavior.
   */
  userAgent?: boolean
}

/**
 * Configure the logger used by the GraphQL server.
 *
 * @param logger your logger
 * @param options the GraphQLLoggerOptions such as tracing, operationName, etc
 */
type LoggerConfig = { logger: BaseLogger; options?: GraphQLLoggerOptions }

/**
 * GraphQLHandlerOptions
 */
interface GraphQLHandlerOptions {
  /**
   * @description Customize GraphQL Logger
   *
   * Collect resolver timings, and exposes trace data for
   * an individual request under extensions as part of the GraphQL response.
   */
  loggerConfig: LoggerConfig

  /**
   * @description  Modify the resolver and global context.
   */
  context?: Context | ContextFunction

  /**
   * A @description n async function that maps the auth token retrieved from the request headers to an object.
   * Is it executed when the `auth-provider` contains one of the supported providers.
   */
  getCurrentUser?: GetCurrentUser

  /**
   *  @description A callback when an unhandled exception occurs. Use this to disconnect your prisma instance.
   */
  onException?: () => void

  /**
   * T @description he GraphQL Schema
   */
  schema: GraphQLSchema

  /**
   *  @description CORS configuration
   */
  cors?: CorsConfig

  /**
   *  @description Healthcheck
   */
  onHealthCheck?: OnHealthcheckFn

  /**
   *  @description Limit the complexity of the queries solely by their depth.
   *
   * @see https://www.npmjs.com/package/graphql-depth-limit#documentation
   */
  depthLimitOptions?: DepthLimitConfig

  /**
   * @description  Only allows the specified operation types (e.g. subscription, query or mutation).
   *
   * By default, only allow query and mutation (ie, do not allow subscriptions).
   *
   * @see https://github.com/dotansimha/envelop/tree/main/packages/plugins/filter-operation-type
   */

  allowedOperations?: AllowedOperations

  /**
   * @description  Custom Envelop plugins
   */
  extraPlugins?: Plugin<any>[]

  /**
   * @description  Customize the GraphiQL Endpoint that appears in the location bar of the GraphQL Playground
   *
   * Defaults to '/graphql' as this value must match the name of the `graphql` function on the api-side.
   *
   */
  graphiQLEndpoint?: string
}

/**
 * Extracts and parses body payload from event with base64 encoding check
 *
 */
const parseEventBody = (event: APIGatewayProxyEvent) => {
  if (event.isBase64Encoded) {
    return JSON.parse(Buffer.from(event.body || '', 'base64').toString('utf-8'))
  } else {
    return event.body && JSON.parse(event.body)
  }
}

function normalizeRequest(event: APIGatewayProxyEvent): Request {
  const body = parseEventBody(event)

  return {
    headers: event.headers || {},
    method: event.httpMethod,
    query: event.queryStringParameters,
    body,
  }
}

/*
 * Prevent unexpected error messages from leaking to the GraphQL clients.
 *
 * Unexpected errors are those that are not Envelop or GraphQL errors
 **/
export const formatError: FormatErrorHandler = (err) => {
  if (
    err.originalError &&
    err.originalError instanceof EnvelopError === false
  ) {
    return new GraphQLError('Something went wrong.')
  }

  return err
}

/**
 * Creates an Enveloped GraphQL Server.
 *
 * @see https://www.envelop.dev/ for information about envelop
 * @see https://www.envelop.dev/plugins for available envelop plugins
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = ({
  loggerConfig,
  schema,
  context,
  getCurrentUser,
  onException,
  extraPlugins,
  cors,
  onHealthCheck,
  depthLimitOptions,
  allowedOperations,
  graphiQLEndpoint,
}: GraphQLHandlerOptions) => {
  // Important: Plugins are executed in order of their usage, and inject functionality serially,
  // so the order here matters

  const authDirectiveSchemas = makeExecutableSchema({
    typeDefs: authDirectiveDocumentNodes,
  })

  const schemaWithBuiltInDirectives = mergeSchemas({
    schemas: [schema, authDirectiveSchemas],
  })

  const plugins: Plugin<any>[] = [
    // Simple LRU for caching parse results.
    useParserCache(),
    // Simple LRU for caching validate results.
    useValidationCache(),
    // Simplest plugin to provide your GraphQL schema.
    useSchema(schemaWithBuiltInDirectives),
    // Custom Redwood plugins
    useRedwoodAuthContext(getCurrentUser),
    useRedwoodGlobalContextSetter(),
    useRedwoodLogger(loggerConfig),

    // -------------  Enforce Auth Directives
    useRedwoodDirective({
      name: 'requireAuth',
      onExecute: requireAuth,
    }),

    useRedwoodDirective({
      name: 'skipAuth',
      onExecute: skipAuth,
    }),
    // --------------- Enforce Auth Directives

    // Limits the depth of your GraphQL selection sets.
    useDepthLimit({
      maxDepth: (depthLimitOptions && depthLimitOptions.maxDepth) || 10,
      ignore: (depthLimitOptions && depthLimitOptions.ignore) || [],
    }),
    // Only allow execution of specific operation types
    useFilterAllowedOperations(allowedOperations || ['mutation', 'query']),
    // Prevent unexpected error messages from leaking to the GraphQL clients.
    useMaskedErrors({ formatError }),
  ]

  const isDevEnv = process.env.NODE_ENV === 'development'

  if (!isDevEnv) {
    plugins.push(useDisableIntrospection())
  }

  if (context) {
    plugins.push(useRedwoodPopulateContext(context))
  }

  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  const corsContext = createCorsContext(cors)

  const healthcheckContext = createHealthcheckContext(
    onHealthCheck,
    corsContext
  )

  const createSharedEnvelop = envelop({
    plugins,
    enableInternalTracing: loggerConfig.options?.tracing,
  })

  const handlerFn = async (
    event: APIGatewayProxyEvent,
    lambdaContext: LambdaContext
  ): Promise<APIGatewayProxyResult> => {
    const enveloped = createSharedEnvelop({ event, context: lambdaContext })

    const logger = loggerConfig.logger

    // In the future, this could be part of a specific handler for AWS lambdas
    lambdaContext.callbackWaitsForEmptyEventLoop = false

    // In the future, the normalizeRequest can take more flexible params, maybe even cloud provider name
    // and return a normalized request structure.
    const request = normalizeRequest(event)

    if (healthcheckContext.isHealthcheckRequest(event.path)) {
      return healthcheckContext.handleHealthCheck(request, event)
    }

    const corsHeaders = cors ? corsContext.getRequestHeaders(request) : {}

    if (corsContext.shouldHandleCors(request)) {
      return {
        body: '',
        statusCode: 200,
        headers: corsHeaders,
      }
    }

    if (isDevEnv && shouldRenderGraphiQL(request)) {
      return {
        body: renderPlaygroundPage({
          endpoint: graphiQLEndpoint || '/graphql',
        }),
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
      }
    }

    const { operationName, query, variables } = getGraphQLParameters(request)

    let lambdaResponse: APIGatewayProxyResult

    try {
      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        validationRules: undefined,
        ...enveloped,
        contextFactory: enveloped.contextFactory,
      })

      if (result.type === 'RESPONSE') {
        lambdaResponse = {
          body: JSON.stringify(result.payload),
          statusCode: 200,
          headers: {
            ...(result.headers || {}).reduce(
              (prev, header) => ({ ...prev, [header.name]: header.value }),
              {}
            ),
            ...corsHeaders,
          },
        }
      } else if (result.type === 'MULTIPART_RESPONSE') {
        lambdaResponse = {
          body: JSON.stringify({ error: 'Streaming is not supported yet!' }),
          statusCode: 500,
        }
      } else {
        lambdaResponse = {
          body: JSON.stringify({ error: 'Unexpected flow' }),
          statusCode: 500,
        }
      }
    } catch (e) {
      logger.error(e)
      onException && onException()

      lambdaResponse = {
        body: JSON.stringify({ error: 'GraphQL execution failed' }),
        statusCode: 200, // should be 500
      }
    }

    if (!lambdaResponse.headers) {
      lambdaResponse.headers = {}
    }

    lambdaResponse.headers['Content-Type'] = 'application/json'

    return lambdaResponse
  }

  return (
    event: APIGatewayProxyEvent,
    context: LambdaContext
  ): Promise<any> => {
    const execFn = async () => {
      try {
        return await handlerFn(event, context)
      } catch (e) {
        onException && onException()

        throw e
      }
    }

    if (getAsyncStoreInstance()) {
      // This must be used when you're self-hosting RedwoodJS.
      return getAsyncStoreInstance().run(new Map(), execFn)
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      return execFn()
    }
  }
}
