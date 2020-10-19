import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { Config, CreateHandlerOptions } from 'apollo-server-lambda'
import type { Context, ContextFunction } from 'apollo-server-core'
import type { GlobalContext } from '../globalContext'
import type { AuthContextPayload } from '../auth'
import type { APIGatewayProxyCallback } from 'aws-lambda'
import { ApolloServer } from 'apollo-server-lambda'
import { getAuthenticationContext } from '../auth'
import { setContext } from '../globalContext'

export type GetCurrentUser = (
  decoded: AuthContextPayload[0],
  raw: AuthContextPayload[1]
) => Promise<null | Record<string, unknown> | string>

type ContextProps = {
  event: APIGatewayProxyEvent
  context: GlobalContext & LambdaContext
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
export function createContextHandler<T>(
  userContext?: Context<T> | ContextFunction<ContextProps, T>,
  getCurrentUser?: GetCurrentUser
) {
  return async ({ event, context }: ContextProps) => {
    // Prevent the Serverless function from waiting for all resources (db connections)
    // to be released before returning a reponse.
    context.callbackWaitsForEmptyEventLoop = false

    // If the request contains authorization headers, we'll decode the providers that we support,
    // and pass those to the `currentUser`.
    const authContext = await getAuthenticationContext({ event, context })
    if (authContext) {
      context.currentUser = getCurrentUser
        ? await getCurrentUser(authContext[0], authContext[1])
        : authContext
    }

    const customUserContext =
      typeof userContext === 'function'
        ? await (userContext as ContextFunction<ContextProps, T>)({
            event,
            context,
          })
        : userContext

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

  cors?: CreateHandlerOptions['cors']
  onHealthCheck?: CreateHandlerOptions['onHealthCheck']
}
/**
 * Creates an Apollo GraphQL Server.
 *
 * ```js
 * export const handler = createGraphQLHandler({ schema, context, getCurrentUser })
 * ```
 */
export function createGraphQLHandler({
  context,
  getCurrentUser,
  onException,
  cors,
  onHealthCheck,
  ...options
}: GraphQLHandlerOptions = {}) {
  const isDevEnv = process.env.NODE_ENV !== 'production'
  const handler = new ApolloServer({
    // Turn off playground, introspection and debug in production.
    debug: isDevEnv,
    introspection: isDevEnv,
    playground: isDevEnv,
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
    callback: APIGatewayProxyCallback
  ): void => {
    try {
      handler(event, context, callback)
    } catch (e) {
      onException && onException()
      throw e
    }
  }
}
