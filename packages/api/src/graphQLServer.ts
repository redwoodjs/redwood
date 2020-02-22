import { ApolloServer, Config } from 'apollo-server-lambda'

import { setContext } from './globalContext'

export const handleContext = (options: Config) => {
  // Returns a function that deals with the context on request.
  return ({ context = {}, events } = {}) => {
    // Prevent the Lambda function from waiting for all resources,
    // such as database connections, to be released before returning
    // a reponse.
    context.callbackWaitsForEmptyEventLoop = false

    // The user can a context object or function when they
    // initialize the handler.
    let userContext = options?.context || {}
    if (typeof userContext === 'function') {
      userContext = userContext({ context, events })
    }

    // The context object returned from this function is passed to
    // the resolvers.
    // Redwood also introduces a **global** context object.
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
    ...options,
    context: handleContext(options),
  }).createHandler()

  return handler
}
