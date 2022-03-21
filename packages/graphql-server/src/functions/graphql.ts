/* eslint-disable react-hooks/rules-of-hooks */
import {
  EnvelopError,
  FormatErrorHandler,
  GraphQLYogaError,
} from '@graphql-yoga/common'
import type { PluginOrDisabledPlugin } from '@graphql-yoga/common'


import { useDepthLimit } from '@envelop/depth-limit'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import { RedwoodError } from '@redwoodjs/api'
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda'
import { GraphQLError, GraphQLSchema, OperationTypeNode } from 'graphql'
import {
  CORSOptions,
  createServer,
} from '@graphql-yoga/common'

import { makeDirectivesForPlugin } from '../directives/makeDirectives'
import { getAsyncStoreInstance } from '../globalContext'
import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'
import { useRedwoodAuthContext } from '../plugins/useRedwoodAuthContext'
import {
  DirectivePluginOptions,
  useRedwoodDirective,
} from '../plugins/useRedwoodDirective'
import { useRedwoodGlobalContextSetter } from '../plugins/useRedwoodGlobalContextSetter'
import { useRedwoodLogger } from '../plugins/useRedwoodLogger'
import { useRedwoodPopulateContext } from '../plugins/useRedwoodPopulateContext'

import { ValidationError } from '../errors'

import type { GraphQLHandlerOptions } from './types'
import { Request } from 'cross-undici-fetch'

/*
 * Prevent unexpected error messages from leaking to the GraphQL clients.
 *
 * Unexpected errors are those that are not Envelop, GraphQL, or Redwood errors
 **/
export const formatError: FormatErrorHandler = (err: any, message: string) => {
  const allowErrors = [GraphQLYogaError, EnvelopError, RedwoodError]

  // If using graphql-scalars, when validating input
  // the original TypeError is wrapped in an GraphQLError object.
  // We extract out and present the portion of the original error's
  // validation message that is friendly to send to the end user
  // @see https://github.com/Urigo/graphql-scalars and their validate method
  if (err && err instanceof GraphQLError) {
    if (err.originalError && err.originalError instanceof TypeError) {
      return new ValidationError(err.originalError.message)
    }
  }

  if (
    err.originalError &&
    !allowErrors.find(
      (allowedError) => err.originalError instanceof allowedError
    )
  ) {
    return new GraphQLError(message)
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
  depthLimitOptions,
  allowedOperations,
  defaultError = 'Something went wrong.',
  graphiQLEndpoint = '/graphql',
  schemaOptions,
}: GraphQLHandlerOptions) => {
  let schema: GraphQLSchema
  let redwoodDirectivePlugins = [] as PluginOrDisabledPlugin[]
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

  const plugins: Array<PluginOrDisabledPlugin> = []

  if (!isDevEnv) {
    plugins.push(useDisableIntrospection())
  }

  // Custom Redwood plugins
  plugins.push(useRedwoodAuthContext(getCurrentUser))
  plugins.push(useRedwoodGlobalContextSetter())

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
    useFilterAllowedOperations(
      allowedOperations || [OperationTypeNode.QUERY, OperationTypeNode.MUTATION]
    )
  )

  // App-defined plugins
  if (extraPlugins && extraPlugins.length > 0) {
    plugins.push(...extraPlugins)
  }

  // Must be "last" in plugin chain so can process any data added to results and extensions
  plugins.push(useRedwoodLogger(loggerConfig))

  const yoga = createServer({
    schema,
    plugins,
    maskedErrors: {
      formatError,
      errorMessage: defaultError,
    },
    logging: logger,
    graphiql: isDevEnv ? {
      title: 'Redwood GraphQL playground',
      endpoint: graphiQLEndpoint,
      defaultQuery: `query Redwood {
        redwood {
          version
        }
      }`,
      headerEditorEnabled: true
    } : false,
    cors: (request: Request) => {
      const yogaCORSOptions: CORSOptions = {}
      if (cors?.methods) {
        if (typeof cors.methods === 'string') {
          yogaCORSOptions.methods = [cors.methods]
        } else if (Array.isArray(cors.methods)) {
          yogaCORSOptions.methods = cors.methods
        }
      }
      if (cors?.allowedHeaders) {
        if (typeof cors.allowedHeaders === 'string') {
          yogaCORSOptions.allowedHeaders = [cors.allowedHeaders]
        } else if (Array.isArray(cors.allowedHeaders)) {
          yogaCORSOptions.allowedHeaders = cors.allowedHeaders
        }
      }

      if (cors?.exposedHeaders) {
        if (typeof cors.exposedHeaders === 'string') {
          yogaCORSOptions.exposedHeaders = [cors.exposedHeaders]
        } else if (Array.isArray(cors.exposedHeaders)) {
          yogaCORSOptions.exposedHeaders = cors.exposedHeaders
        }
      }

      if (cors?.credentials) {
        yogaCORSOptions.credentials = cors.credentials
      }

      if (cors?.maxAge) {
        yogaCORSOptions.maxAge = cors.maxAge
      }

      if (cors?.origin) {
        const requestOrigin = request.headers.get('origin')
        if (typeof cors.origin === 'string') {
          yogaCORSOptions.origin = [cors.origin]
        } else if (
          requestOrigin &&
          (typeof cors.origin === 'boolean' ||
            (Array.isArray(cors.origin) &&
              requestOrigin &&
              cors.origin.includes(requestOrigin)))
        ) {
          yogaCORSOptions.origin = [requestOrigin]
        }

        const requestAccessControlRequestHeaders = request.headers.get(
          'access-control-request-headers'
        )
        if (!cors.allowedHeaders && requestAccessControlRequestHeaders) {
          yogaCORSOptions.allowedHeaders = [requestAccessControlRequestHeaders]
        }
      }
      return yogaCORSOptions
    },
  })

  const handlerFn = async (
    event: APIGatewayProxyEvent,
    lambdaContext: LambdaContext
  ): Promise<APIGatewayProxyResult> => {
    const request = new Request(`http://localhost${event.path}`, {
      method: event.httpMethod,
      headers: event.headers as HeadersInit,
      body: (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') ? event.body : null,
    })

    // In the future, this could be part of a specific handler for AWS lambdas
    lambdaContext.callbackWaitsForEmptyEventLoop = false

    let lambdaResponse: APIGatewayProxyResult

    try {
      const response = await yoga.handleRequest(request, {
        event,
        requestContext: lambdaContext,
      })
      const multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'] = {}
      response.headers.forEach((value, key) => {
        multiValueHeaders[key] = multiValueHeaders[key] || []
        multiValueHeaders[key].push(value)
      })
      lambdaResponse = {
        body: await response.text(),
        statusCode: response.status,
        multiValueHeaders,
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
