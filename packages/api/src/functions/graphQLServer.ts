import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { Config } from 'apollo-server-lambda'
import type { Context, ContextFunction } from 'apollo-server-core'
import type { AuthTokenType } from 'src/auth/decodeAuthToken'
//
import { ApolloServer } from 'apollo-server-lambda'
import { decodeAuthToken } from 'src/auth/decodeAuthToken'
import { setContext } from 'src/globalContext'

export type GetCurrentUser = (
  authToken?: AuthTokenType
) => Promise<null | object | string>

/**
 * We use Apollo Server's `context` option as an entry point for constructing our own
 * global context object.
 *
 * A user passes a context object or async function when instantiating
 * `createGraphQLHandler` and result of `context` is appended to the resolver,
 * and the global context.
 *
 * Context from Apollo's Docs:
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
    context: LambdaContext
  }) => {
    // Prevent the Lambda function from waiting for all resources,
    // such as database connections, to be released before returning a reponse.
    context.callbackWaitsForEmptyEventLoop = false

    // For authentication: Get the authorization information from the request
    // headers.
    const authToken = await decodeAuthToken({ event, context })
    const currentUser =
      typeof getCurrentUser == 'function'
        ? await getCurrentUser(authToken)
        : authToken

    if (typeof userContext === 'function') {
      userContext = await userContext({ event, context })
    }

    // The context object returned from this function is passed
    // to the second argument of the resolvers.
    // This also sets **global** context object, which can be imported with:
    // import { context } from '@redwoodjs/api'
    return setContext({
      currentUser,
      ...context,
      ...userContext,
    })
  }
}

interface GraphQLHandlerOptions extends Config {
  /**
   * Modify the resolver and global context.
   */
  context?: Context | ContextFunction
  /**
   * An async function that maps the auth token retrieved from the request headers
   * to an object.
   */
  getCurrentUser?: GetCurrentUser
  /**
   * A callback when an unhandled exception occurs. Use this to disconnect your prisma
   * instance.
   */
  onException?: () => void
}
/**
 * Creates an Apollo GraphQL Server.
 *
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export const createGraphQLHandler = (
  {
    context,
    getCurrentUser,
    onException,
    ...options
  }: GraphQLHandlerOptions = {},
  /**
   * @deprecated please use onException instead to disconnect your database.
   * */
  db: any
) => {
  const handler = new ApolloServer({
    playground: process.env.NODE_ENV !== 'production',
    ...options,
    context: createContextHandler(context, getCurrentUser),
  }).createHandler()

  return (
    event: APIGatewayProxyEvent,
    context: LambdaContext,
    callback: any
  ): void => {
    try {
      handler(event, context, callback)
    } catch (e) {
      onException && onException()
      // Disconnect from the database (recommended by Prisma), this step will be
      // removed in future releases.
      db && db.disconnect()
      throw e
    }
  }
}
