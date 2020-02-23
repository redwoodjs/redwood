import { ApolloServer, Config } from 'apollo-server-lambda'

import {
  APIGatewayProxyEvent,
  Context as LambdaContext,
} from 'aws-lambda';

import { setContext } from './globalContext'

export const handleContext = (options: Config) => {
  // Returns a function that deals with the context on request.
  return ({ context, event }: {context: LambdaContext, event: APIGatewayProxyEvent}) => {
    // Prevent the Lambda function from waiting for all resources,
    // such as database connections, to be released before returning
    // a reponse.
    context.callbackWaitsForEmptyEventLoop = false

    // The user can set a context object or function when they
    // initialize the handler.
    let userContext = options?.context || {}
    if (typeof userContext === 'function') {
      userContext = userContext({ context, event })
    }

    // The context object returned from this function is passed to
    // the resolvers.
    // This also sets **global** context object, which can be imported:
    // import { context } from '@redwoodjs/api'
    return setContext({
      ...context,
      ...userContext,
    })
  }
}

/**
 * Creates an Apollo GraphQL Server.
 *
 * ```js
 * export const handler = createGraphQLHandler({ schema, context })
 * ```
 */
export const createGraphQLHandler = (options: Config = {}) => {
  const handler = new ApolloServer({
    playground: process.env.NODE_ENV !== 'production',
    ...options,
    context: handleContext(options),
  }).createHandler()

  return handler
}
