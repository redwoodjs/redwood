import type {
  Context,
  ContextFunction,
  GraphQLRequestContext,
} from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-lambda'
import type { Config, CreateHandlerOptions } from 'apollo-server-lambda'
import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import depthLimit from 'graphql-depth-limit'
import { BaseLogger } from 'pino'
import { v4 as uuidv4 } from 'uuid'

import type { AuthContextPayload } from 'src/auth'
import { getAuthenticationContext } from 'src/auth'
import {
  GlobalContext,
  setContext,
  getPerRequestContext,
  usePerRequestContext,
} from 'src/globalContext'

export type GetCurrentUser = (
  decoded: AuthContextPayload[0],
  raw: AuthContextPayload[1],
  req?: AuthContextPayload[2]
) => Promise<null | Record<string, unknown> | string>

/**
 * Settings for limiting the complexity of the queries solely by their depth.
 * Use by graphql-depth-limit,
 *
 * @see https://github.com/stems/graphql-depth-limit
 */
type DepthLimitOptions = { maxDepth: number; ignore?: string[] }

/**
 * Options for request and response information to include in the log statements
 * output by UseRedwoodLogger around the execution event
 */
type LoggerOptions = {
  data?: boolean
  operationName?: boolean
  requestId?: boolean
  query?: boolean
  tracing?: boolean
  userAgent?: boolean
}

/**
 * Configure the logger.
 *
 * @param logger your logger
 * @param options the LoggerOptions such as tracing, operationName, etc
 */
type LoggerConfig = { logger: BaseLogger; options?: LoggerOptions }

/**
 * This plugin logs every time an operation is being executed and
 * when the execution of the operation is done.
 *
 * It adds information using a child logger from the context
 * such as the operation name, request id, errors, and header info
 * to help trace and diagnose issues.
 *
 * Tracing and timing information can be set in LoggerConfig options.
 *
 * @see https://www.apollographql.com/docs/apollo-server/integrations/plugins/
 * @returns
 */
const UseRedwoodLogger = (loggerConfig?: LoggerConfig): ApolloServerPlugin => {
  return {
    requestDidStart(requestContext: GraphQLRequestContext) {
      const logger = requestContext.logger as BaseLogger

      const includeData = loggerConfig?.options?.data || true
      const includeOperationName = loggerConfig?.options?.operationName || true
      const includeRequestId = loggerConfig?.options?.requestId
      const includeTracing = loggerConfig?.options?.tracing
      const includeUserAgent = loggerConfig?.options?.userAgent
      const includeQuery = loggerConfig?.options?.query

      if (!logger) {
        return
      }

      const childLoggerOptions = {} as any

      if (includeUserAgent) {
        childLoggerOptions['userAgent'] =
          requestContext.request.http?.headers.get('user-agent') as string
      }

      if (includeQuery) {
        childLoggerOptions['query'] = requestContext.request.query
      }

      const childLogger = logger.child({
        name: 'apollo-graphql-server',
        ...childLoggerOptions,
      })

      const options = {} as any

      if (includeTracing) {
        options['metrics'] = requestContext.metrics
      }

      childLogger.info({ ...options }, 'GraphQL requestDidStart')

      return {
        executionDidStart(requestContext: GraphQLRequestContext) {
          const options = {} as any

          if (includeOperationName) {
            options['operationName'] = requestContext.operationName
          }

          if (includeRequestId) {
            options['requestId'] =
              requestContext.request.http?.headers.get('x-amz-request-id') ||
              uuidv4()
          }

          childLogger.debug({ ...options }, 'GraphQL executionDidStart')
        },
        willSendResponse(requestContext: GraphQLRequestContext) {
          const options = {} as any

          if (includeData) {
            options['data'] = requestContext.response?.data
          }

          if (includeOperationName && requestContext.operationName) {
            options['operationName'] = requestContext.operationName
          }

          if (includeRequestId) {
            options['requestId'] =
              requestContext.request.http?.headers.get('x-amz-request-id') ||
              uuidv4()
          }

          if (includeTracing) {
            options['tracing'] = requestContext.response?.extensions?.tracing
          }

          childLogger.info({ ...options }, 'GraphQL willSendResponse')
        },
        didEncounterErrors(requestContext: GraphQLRequestContext) {
          const options = {} as any

          if (includeOperationName) {
            options['operationName'] = requestContext.operationName
          }

          if (includeRequestId) {
            options['requestId'] =
              requestContext.request.http?.headers.get('x-amz-request-id') ||
              uuidv4()
          }

          if (includeTracing) {
            options['tracing'] = requestContext.response?.extensions?.tracing
          }
          childLogger.error(
            {
              errors: requestContext.errors,
              ...options,
            },
            'GraphQL didEncounterErrors'
          )
        },
      }
    },
  }
}

/**
 * We use Apollo Server's `context` option as an entry point to construct our
 * own global context.
 *
 * Context explained by Apollo's Docs:
 * Context is an object shared by all resolvers in a particular query,
 * and is used to contain per-request state, including authentication information,
 * dataloader instances, and anything else that should be taken into account when
 * resolving the query.
 */
export const createContextHandler = (
  userContext?: Context | ContextFunction,
  getCurrentUser?: GetCurrentUser
) => {
  return async ({
    event,
    context,
  }: {
    event: APIGatewayProxyEvent
    context: GlobalContext & LambdaContext
  }) => {
    // Prevent the Serverless function from waiting for all resources (db connections)
    // to be released before returning a response.
    context.callbackWaitsForEmptyEventLoop = false

    // If the request contains authorization headers, we'll decode the providers that we support,
    // and pass those to the `currentUser`.
    const authContext = await getAuthenticationContext({ event, context })
    if (authContext) {
      context.currentUser = getCurrentUser
        ? await getCurrentUser(authContext[0], authContext[1], authContext[2])
        : authContext
    }

    let customUserContext = userContext
    if (typeof userContext === 'function') {
      // if userContext is a function, run that and return just the result
      customUserContext = await userContext({ event, context })
    }
    // Sets the **global** context object, which can be imported with:
    // import { context } from '@redwoodjs/api'
    return setContext({
      ...context,
      ...customUserContext,
    })
  }
}

interface GraphQLHandlerOptions extends Config {
  /**
   * Modify the resolver and global context.
   */
  context?: Context | ContextFunction

  /**
   * An async function that maps the auth token retrieved from the request headers to an object.
   * Is it executed when the `auth-provider` contains one of the supported providers.
   */
  getCurrentUser?: GetCurrentUser

  /**
   * A callback when an unhandled exception occurs. Use this to disconnect your prisma instance.
   */
  onException?: () => void

  /**
   * CORS configuration
   */
  cors?: CreateHandlerOptions['cors']

  /**
   * Customize GraphQL Logger with options
   */
  loggerConfig?: LoggerConfig

  /**
   * Healthcheck
   */
  onHealthCheck?: CreateHandlerOptions['onHealthCheck']

  /**
   * Limit the complexity of the queries solely by their depth.
   * @see https://www.npmjs.com/package/graphql-depth-limit#documentation
   */
  depthLimitOptions?: DepthLimitOptions

  /**
   * Custom Apollo Server plugins
   */
  extraPlugins?: ApolloServerPlugin[]
}
/**
 * Creates an Apollo GraphQL Server.
 *
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = ({
  context,
  getCurrentUser,
  onException,
  cors,
  loggerConfig,
  onHealthCheck,
  extraPlugins,
  depthLimitOptions,
  ...options
}: GraphQLHandlerOptions = {}) => {
  const isDevEnv = process.env.NODE_ENV === 'development'

  const plugins = options.plugins || []

  plugins.push(UseRedwoodLogger(loggerConfig))

  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  // extract depth limit configuration and use a sensible default
  const ignore = (depthLimitOptions && depthLimitOptions.ignore) || []
  const maxDepth = (depthLimitOptions && depthLimitOptions.maxDepth) || 10

  const validationRules = options.validationRules || []

  validationRules.push(depthLimit(maxDepth, { ignore }))

  const handler = new ApolloServer({
    // Turn off playground, introspection and debug in production.
    debug: isDevEnv,
    introspection: isDevEnv,
    logger: loggerConfig && loggerConfig.logger,
    playground: isDevEnv,
    plugins,
    // Log trace timings if set in loggerConfig
    tracing: loggerConfig?.options?.tracing,
    // Limits the depth of your GraphQL selection sets.
    validationRules,
    // Log the errors in the console
    formatError: (error) => {
      if (isDevEnv) {
        // I want the dev-server to pick this up!?
        // TODO: Move the error handling into a separate package
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        import('@redwoodjs/dev-server/dist/error')
          .then(({ handleError }) => {
            return handleError(error.originalError as Error)
          })
          .then(console.log)
          .catch(() => {})
      }
      return error
    },
    // Wrap the user's context function in our own
    context: createContextHandler(context, getCurrentUser),
    ...options,
  }).createHandler({ cors, onHealthCheck })

  return (
    event: APIGatewayProxyEvent,
    context: LambdaContext,
    callback: any
  ): void => {
    if (usePerRequestContext()) {
      // This must be used when you're self-hosting RedwoodJS.
      const localAsyncStorage = getPerRequestContext()
      localAsyncStorage.run(new Map(), () => {
        try {
          handler(event, context, callback)
        } catch (e) {
          onException && onException()
          throw e
        }
      })
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      try {
        handler(event, context, callback)
      } catch (e) {
        onException && onException()
        throw e
      }
    }
  }
}
