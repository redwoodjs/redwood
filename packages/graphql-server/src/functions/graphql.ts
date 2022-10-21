/* eslint-disable react-hooks/rules-of-hooks */
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useFilterAllowedOperations } from '@envelop/filter-operation-type'
import { EnvelopArmor } from '@escape.tech/graphql-armor'
import type { PluginOrDisabledPlugin } from '@graphql-yoga/common'
import {
  EnvelopError,
  FormatErrorHandler,
  GraphQLYogaError,
} from '@graphql-yoga/common'
import { createServer } from '@graphql-yoga/common'
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda'
import { Headers, Request } from 'cross-undici-fetch'
import { GraphQLError, GraphQLSchema, OperationTypeNode } from 'graphql'
import omitBy from 'lodash.omitby'

import { RedwoodError } from '@redwoodjs/api'

import { mapRwCorsOptionsToYoga } from '../cors'
import { makeDirectivesForPlugin } from '../directives/makeDirectives'
import { ValidationError } from '../errors'
import { getAsyncStoreInstance } from '../globalContext'
import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'
import { useRedwoodAuthContext } from '../plugins/useRedwoodAuthContext'
import type { useRedwoodDirectiveReturn } from '../plugins/useRedwoodDirective'
import {
  DirectivePluginOptions,
  useRedwoodDirective,
} from '../plugins/useRedwoodDirective'
import { useRedwoodGlobalContextSetter } from '../plugins/useRedwoodGlobalContextSetter'
import { useRedwoodLogger } from '../plugins/useRedwoodLogger'
import { useRedwoodPopulateContext } from '../plugins/useRedwoodPopulateContext'

import type { GraphQLHandlerOptions } from './types'

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

const convertToMultiValueHeaders = (headers: Headers) => {
  const multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'] = {}
  for (const [key, value] of headers) {
    multiValueHeaders[key] = multiValueHeaders[key] || []
    multiValueHeaders[key].push(value)
  }
  return multiValueHeaders
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
  healthCheckId,
  loggerConfig,
  context,
  getCurrentUser,
  onException,
  generateGraphiQLHeader,
  extraPlugins,
  authDecoder,
  cors,
  services,
  sdls,
  directives = [],
  graphQLArmorConfig,
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
      ;(redwoodDirectivePlugins as useRedwoodDirectiveReturn[]) =
        projectDirectives.map((directive) =>
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
  plugins.push(useRedwoodAuthContext(getCurrentUser, authDecoder))
  plugins.push(useRedwoodGlobalContextSetter())

  if (context) {
    plugins.push(useRedwoodPopulateContext(context))
  }

  // Custom Redwood plugins
  plugins.push(...redwoodDirectivePlugins)

  // Add GraphQL Armor security plugins
  const armor = new EnvelopArmor({
    maxDepth: {
      n: 8,
      ...graphQLArmorConfig?.maxDepth,
    },
    ...omitBy(graphQLArmorConfig, (_value, key) => key === 'maxDepth'),
  })
  const protection = armor.protect()

  plugins.push(...protection.plugins)
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

  // Must be "last" in plugin chain, but before error masking
  // so can process any data added to results and extensions
  plugins.push(useRedwoodLogger(loggerConfig))

  const yoga = createServer({
    id: healthCheckId,
    schema,
    plugins,
    maskedErrors: {
      formatError,
      errorMessage: defaultError,
    },
    logging: logger,
    graphiql: isDevEnv
      ? {
          title: 'Redwood GraphQL Playground',
          endpoint: graphiQLEndpoint,
          headers: generateGraphiQLHeader
            ? generateGraphiQLHeader()
            : `{"x-auth-comment": "See documentation: https://redwoodjs.com/docs/cli-commands#setup-graphiQL-headers on how to auto generate auth headers"}`,
          defaultQuery: `query Redwood {
  redwood {
    version
  }
}`,
          headerEditorEnabled: true,
        }
      : false,
    cors: (request: Request) => {
      const requestOrigin = request.headers.get('origin')
      return mapRwCorsOptionsToYoga(cors, requestOrigin)
    },
  })

  function buildRequestObject(event: APIGatewayProxyEvent) {
    const requestHeaders = new Headers()
    const supportsMultiValueHeaders =
      event.multiValueHeaders && Object.keys(event.multiValueHeaders).length > 0
    // Avoid duplicating header values, because Yoga gets confused with CORS
    if (supportsMultiValueHeaders) {
      for (const headerName in event.multiValueHeaders) {
        const headerValues = event.multiValueHeaders[headerName]
        if (headerValues) {
          for (const headerValue of headerValues) {
            requestHeaders.append(headerName, headerValue)
          }
        }
      }
    } else {
      for (const headerName in event.headers) {
        const headerValue = event.headers[headerName]
        if (headerValue) {
          requestHeaders.append(headerName, headerValue)
        }
      }
    }

    const protocol = isDevEnv ? 'http' : 'https'

    const requestUrl = new URL(
      event.path,
      protocol + '://' + (event.requestContext?.domainName || 'localhost')
    )

    if (event.multiValueQueryStringParameters) {
      for (const queryStringParam in event.multiValueQueryStringParameters) {
        const queryStringValues =
          event.multiValueQueryStringParameters[queryStringParam]
        if (queryStringValues) {
          if (Array.isArray(queryStringValues)) {
            for (const queryStringValue of queryStringValues) {
              requestUrl.searchParams.append(queryStringParam, queryStringValue)
            }
          } else {
            requestUrl.searchParams.append(
              queryStringParam,
              String(queryStringValues)
            )
          }
        }
      }
    } else if (event.queryStringParameters) {
      for (const queryStringParam in event.queryStringParameters) {
        const queryStringValue = event.queryStringParameters[queryStringParam]
        if (queryStringValue) {
          requestUrl.searchParams.append(queryStringParam, queryStringValue)
        }
      }
    }

    if (
      event.httpMethod === 'GET' ||
      event.httpMethod === 'HEAD' ||
      event.body == null
    ) {
      return new Request(requestUrl.toString(), {
        method: event.httpMethod,
        headers: requestHeaders,
      })
    } else {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body
      return new Request(requestUrl.toString(), {
        method: event.httpMethod,
        headers: requestHeaders,
        body,
      })
    }
  }

  const handlerFn = async (
    event: APIGatewayProxyEvent,
    lambdaContext: LambdaContext
  ): Promise<APIGatewayProxyResult> => {
    // In the future, this could be part of a specific handler for AWS lambdas
    lambdaContext.callbackWaitsForEmptyEventLoop = false

    let lambdaResponse: APIGatewayProxyResult

    // @NOTE AWS types define that multiValueHeaders always exist, even as an empty object
    // But this isn't true on Vercel, it's just undefined.
    const supportsMultiValueHeaders =
      event.multiValueHeaders && Object.keys(event.multiValueHeaders).length > 0

    try {
      const request = buildRequestObject(event)

      const response = await yoga.handleRequest(request, {
        event,
        requestContext: lambdaContext,
      })

      // @WARN - multivalue headers aren't supported on all deployment targets correctly
      // Netlify ✅, Vercel 🛑, AWS ✅,...
      // From https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
      // If you specify values for both headers and multiValueHeaders, API Gateway merges them into a single list.

      lambdaResponse = {
        body: await response.text(),
        statusCode: response.status,

        // Only supply headers if MVH aren't supported, otherwise it causes duplicated headers
        headers: supportsMultiValueHeaders
          ? {}
          : Object.fromEntries(response.headers),
        // Gets ignored if MVH isn't supported
        multiValueHeaders: convertToMultiValueHeaders(response.headers),
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

    /**
     * The header keys are case insensitive, but Fastify prefers these to be lowercase.
     * Therefore, we want to ensure that the headers are always lowercase and unique
     * for compliance with HTTP/2.
     *
     * @see: https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2
     */
    lambdaResponse.headers['content-type'] = 'application/json'

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
