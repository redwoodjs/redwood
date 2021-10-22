/* eslint-disable react-hooks/rules-of-hooks */
import {
  envelop,
  EnvelopError,
  FormatErrorHandler,
  Plugin,
  useMaskedErrors,
  useSchema,
} from '@envelop/core'
import { useDepthLimit } from '@envelop/depth-limit'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import { useParserCache } from '@envelop/parser-cache'
import { useValidationCache } from '@envelop/validation-cache'
import { RedwoodError } from '@redwoodjs/api'
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda'
import { GraphQLError, GraphQLSchema } from 'graphql'
import {
  getGraphQLParameters,
  processRequest,
  Request,
  shouldRenderGraphiQL,
} from 'graphql-helix'
import { renderPlaygroundPage } from 'graphql-playground-html'

import { createCorsContext } from '../cors'
import { makeDirectivesForPlugin } from '../directives/makeDirectives'
import { getAsyncStoreInstance } from '../globalContext'
import { createHealthcheckContext } from '../healthcheck'
import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'
import { useRedwoodAuthContext } from '../plugins/useRedwoodAuthContext'
import {
  DirectivePluginOptions,
  useRedwoodDirective,
} from '../plugins/useRedwoodDirective'
import { useRedwoodGlobalContextSetter } from '../plugins/useRedwoodGlobalContextSetter'
import { useRedwoodLogger } from '../plugins/useRedwoodLogger'
import { useRedwoodPopulateContext } from '../plugins/useRedwoodPopulateContext'

import type { GraphQLHandlerOptions } from './types'
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
 * Unexpected errors are those that are not Envelop, GraphQL, or Redwood errors
 **/
const allowErrors = [EnvelopError, RedwoodError]

export const formatError: FormatErrorHandler = (err: any) => {
  if (err.originalError && !allowErrors.includes(err.originalError)) {
    return new GraphQLError('Something went wrong.')
  }

  return err
}

/**
 * Creates an Enveloped GraphQL Server, configured with default Redwood plugins
 *
 * You can add your own plugins by passing them to the extraPlugins object
 *
 * @see https://www.envelop.dev/ for information about envelop
 * @see https://www.envelop.dev/plugins for available envelop plugins
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = ({
  loggerConfig,
  context,
  getCurrentUser,
  onException,
  extraPlugins,
  cors,
  services,
  sdls,
  directives = [],
  onHealthCheck,
  depthLimitOptions,
  allowedOperations,
  graphiQLEndpoint,
  schemaOptions,
}: GraphQLHandlerOptions) => {
  let schema: GraphQLSchema
  let redwoodDirectivePlugins = [] as Plugin<any>[]
  const logger = loggerConfig.logger

  try {
    // @NOTE: Directives are optional
    const projectDirectives = makeDirectivesForPlugin(directives)

    if (projectDirectives.length > 0) {
      redwoodDirectivePlugins = projectDirectives.map((directive) =>
        useRedwoodDirective(directive as DirectivePluginOptions)
      )
    }

    schema = makeMergedSchema({
      sdls,
      services,
      directives: projectDirectives,
      schemaOptions,
    })
  } catch (e) {
    logger.fatal(e as Error, '\n ⚠️ GraphQL server crashed \n')

    // Forcefully crash the graphql server
    // so users know that a misconfiguration has happened
    process.exit(1)
  }

  // Important: Plugins are executed in order of their usage, and inject functionality serially,
  // so the order here matters
  const isDevEnv = process.env.NODE_ENV === 'development'

  const plugins: Plugin<any>[] = []

  if (!isDevEnv) {
    plugins.push(useDisableIntrospection())
  }

  // Simple LRU for caching parse results.
  plugins.push(useParserCache())
  // Simple LRU for caching validate results.
  plugins.push(useValidationCache())
  // Simplest plugin to provide your GraphQL schema.
  plugins.push(useSchema(schema))

  // Custom Redwood plugins
  plugins.push(useRedwoodAuthContext(getCurrentUser))
  plugins.push(useRedwoodGlobalContextSetter())
  plugins.push(useRedwoodLogger(loggerConfig))

  if (context) {
    plugins.push(useRedwoodPopulateContext(context))
  }

  // Custom Redwood plugins
  plugins.push(...redwoodDirectivePlugins)

  // Limits the depth of your GraphQL selection sets.
  plugins.push(
    useDepthLimit({
      maxDepth: (depthLimitOptions && depthLimitOptions.maxDepth) || 10,
      ignore: (depthLimitOptions && depthLimitOptions.ignore) || [],
    })
  )
  // Only allow execution of specific operation types
  plugins.push(
    useFilterAllowedOperations(allowedOperations || ['mutation', 'query'])
  )

  // App-defined plugins
  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  // Prevent unexpected error messages from leaking to the GraphQL clients.
  plugins.push(useMaskedErrors({ formatError }))

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
    const enveloped = createSharedEnvelop({
      event,
      requestContext: lambdaContext,
    })

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
    } catch (e: any) {
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
