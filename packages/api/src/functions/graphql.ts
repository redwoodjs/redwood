/* eslint-disable react-hooks/rules-of-hooks */
import { useApolloTracing } from '@envelop/apollo-tracing'
import { envelop, useErrorHandler, useSchema, Plugin } from '@envelop/core'
import { useParserCache } from '@envelop/parser-cache'
import { useValidationCache } from '@envelop/validation-cache'
import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  APIGatewayProxyResult,
} from 'aws-lambda'
import {
  GraphQLError,
  GraphQLSchema,
  NoSchemaIntrospectionCustomRule,
} from 'graphql'
import {
  Request,
  getGraphQLParameters,
  processRequest,
  shouldRenderGraphiQL,
} from 'graphql-helix'
import { renderPlaygroundPage } from 'graphql-playground-html'
import { BaseLogger } from 'pino'

import type { AuthContextPayload } from 'src/auth'
import { getAuthenticationContext } from 'src/auth'
import { CorsConfig, createCorsContext } from 'src/cors'
import {
  getPerRequestContext,
  setContext,
  usePerRequestContext,
} from 'src/globalContext'
import { createHealthcheckContext, OnHealthcheckFn } from 'src/healthcheck'

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

interface GraphQLHandlerOptions {
  /**
   * Customize GraphQL Logger
   */
  logger: BaseLogger
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
   * The GraphQL Schema
   */
  schema: GraphQLSchema

  /**
   * Custom Envelop plugins
   */
  extraPlugins?: Plugin<any>[]

  cors?: CorsConfig

  onHealthCheck?: OnHealthcheckFn
}

function normalizeRequest(event: APIGatewayProxyEvent): Request {
  return {
    headers: event.headers || {},
    method: event.httpMethod,
    query: event.queryStringParameters,
    body: event.body && JSON.parse(event.body),
  }
}

function redwoodErrorHandler(errors: Readonly<GraphQLError[]>) {
  for (const error of errors) {
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
}

/**
 * Envelop plugin for injecting the current user into the GraphQL Context,
 * based on custom getCurrentUser function.
 */
const useRedwoodAuthContext = (
  getCurrentUser: GraphQLHandlerOptions['getCurrentUser']
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ context, extendContext }) {
      const lambdaContext = context.context as any

      const authContext = await getAuthenticationContext({
        event: context.event,
        context: lambdaContext,
      })

      if (authContext) {
        const currentUser = getCurrentUser
          ? await getCurrentUser(authContext[0], authContext[1], authContext[2])
          : authContext

        lambdaContext.currentUser = currentUser
      }

      // TODO: Maybe we don't need to spread the entire object here? since it's already there
      extendContext(lambdaContext)
    },
  }
}

export const useUserContext = (
  userContextBuilder: NonNullable<GraphQLHandlerOptions['context']>
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ context, extendContext }) {
      const userContext =
        typeof userContextBuilder === 'function'
          ? await userContextBuilder({ context })
          : userContextBuilder

      extendContext(userContext)
    },
  }
}

/**
 * This Envelop plugin waits until the GraphQL context is done building and sets the
 * Redwood global context which can be imported with:
 * // import { context } from '@redwoodjs/api'
 * @returns
 */
export const useRedwoodGlobalContextSetter =
  (): Plugin<RedwoodGraphQLContext> => ({
    onContextBuilding() {
      return ({ context }) => {
        setContext(context)
      }
    },
  })

const useRedwoodLogger = (
  baseLogger: BaseLogger
): Plugin<RedwoodGraphQLContext> => {
  const childLogger = baseLogger.child({ name: 'GraphQL ' })

  return {
    onExecute({ args }) {
      childLogger.info(
        {
          operationName: args.operationName,
        },
        `GraphQL execution started`
      )

      return {
        onExecuteDone({ result }) {
          if (result.errors && result.errors.length > 0) {
            childLogger.error(
              {
                operationName: args.operationName,
                errors: result.errors,
              },
              `GraphQL execution completed with errors:`
            )
          } else {
            childLogger.info(
              {
                operationName: args.operationName,
              },
              `GraphQL execution completed`
            )
          }
        },
      }
    },
  }
}

/**
 * Creates an Apollo GraphQL Server.
 *
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = ({
  logger,
  schema,
  context,
  getCurrentUser,
  onException,
  extraPlugins,
  cors,
  onHealthCheck,
}: GraphQLHandlerOptions) => {
  logger.debug('>> GraphQLHandlerOptions')
  const plugins: Plugin<any>[] = [
    useParserCache(),
    useValidationCache(),
    useSchema(schema),
    useRedwoodAuthContext(getCurrentUser),
    useRedwoodGlobalContextSetter(),
    useRedwoodLogger(logger),
  ]

  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  if (context) {
    plugins.push(useUserContext(context))
  }

  const isDevEnv = process.env.NODE_ENV === 'development'
  if (isDevEnv) {
    plugins.push(useApolloTracing())
    plugins.push(useErrorHandler(redwoodErrorHandler))
  }

  const corsContext = createCorsContext(cors)
  const healthcheckContext = createHealthcheckContext(
    onHealthCheck,
    corsContext
  )
  const createSharedEnvelop = envelop({ plugins })
  const enveloped = createSharedEnvelop()

  const handlerFn = async (
    event: APIGatewayProxyEvent,
    lambdaContext: LambdaContext
  ): Promise<APIGatewayProxyResult> => {
    // In the future, this could be part of a specific handler for AWS lambdas
    lambdaContext.callbackWaitsForEmptyEventLoop = false

    // In the future, the normalizeRequest can take more flexible params, maybe evne cloud provider name
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

    if (shouldRenderGraphiQL(request)) {
      return {
        body: renderPlaygroundPage({
          endpoint: '/graphql',
        }),
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
      }
    }

    const { operationName, query, variables } = getGraphQLParameters(request)

    logger.debug(
      { requestBody: request.body, operationName, query, variables },
      'getGraphQLParameters'
    )

    let lambdaResponse: APIGatewayProxyResult
    try {
      logger.debug('About to processRequest')

      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        validationRules: isDevEnv
          ? undefined
          : [NoSchemaIntrospectionCustomRule],
        ...enveloped,
        contextFactory: () =>
          enveloped.contextFactory({ event, context: lambdaContext }),
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
      } else if (result.type === 'PUSH') {
        lambdaResponse = {
          body: JSON.stringify({
            error: 'Subscriptions is not supported yet!',
          }),
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
        statusCode: 500,
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

    if (usePerRequestContext()) {
      logger.debug('>>>> This must be used when self-hosting RedwoodJS.')
      // This must be used when you're self-hosting RedwoodJS.
      return getPerRequestContext().run(new Map(), execFn)
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      logger.debug('>>>> is handled individually.')
      return execFn()
    }
  }
}
