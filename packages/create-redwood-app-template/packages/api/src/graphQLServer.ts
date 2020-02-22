import { ApolloServer, Config } from 'apollo-server-lambda'

import { setContext } from './globalContext'

/**
 * An Apollo serverless GraphqL server wrapper
 *
 * ```js
 * export const handler = server({ schema, context }).createHandler()
 * ```
 */
export const createGraphQLHandler = (options: Config = {}) => {
  const handler = new ApolloServer({
    ...options,
    context: ({ context, events }) => {
      // Prevent the Lambda function from waiting for all resources,
      // such as database connections, to be released before returning
      // a reponse.
      context.callbackWaitsForEmptyEventLoop = false

      // The user can a context object or function when they
      // initialize the handler.
      let userContext = options.context
      if (typeof userContext === 'function') {
        userContext = userContext({ context, events })
      }

      // The context object returned in this function is passed to
      // the resolvers. Redwood also introduces a context object.
      // We use some babel-auto-import magic to make it appear that
      // it's available as a global.
      return setContext({
        ...context,
        ...userContext,
      })
    },
  }).createHandler()

  return handler
}
