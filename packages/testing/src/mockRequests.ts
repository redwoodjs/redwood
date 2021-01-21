// MSW is shared by Jest (NodeJS) and Storybook (Webpack)
import {
  setupWorker,
  graphql,
  RequestHandler,
  GraphQLMockedContext,
  GraphQLMockedRequest,
} from 'msw'
import { SetupWorkerApi } from 'msw/lib/types/setupWorker/setupWorker'

// Allow users to call "mockGraphQLQuery" and "mockGraphQLMutation"
// before the server has started. We store the request handlers in
// a queue that is drained once the server is started.
let REQUEST_HANDLER_QUEUE: RequestHandler[] = []
let SERVER_INSTANCE: SetupWorkerApi | any

/**
 * Plugs fetch for the correct target in order to capture requests.
 *
 * Request handlers can be registered lazily (via `mockGraphQL<Query|Mutation>`),
 * the queue will be drained and used.
 */
export const startMSW = async (target: 'node' | 'browsers') => {
  if (SERVER_INSTANCE) {
    return SERVER_INSTANCE
  }

  if (target === 'browsers') {
    SERVER_INSTANCE = setupWorker()
    await SERVER_INSTANCE.start()
  } else {
    const { setupServer } = require('msw/node')
    SERVER_INSTANCE = setupServer()
    await SERVER_INSTANCE.listen()
  }

  return SERVER_INSTANCE
}

export const setupRequestHandlers = () => {
  SERVER_INSTANCE.resetHandlers()
  // Register all the handlers that are stored in the queue.
  for (const handler of REQUEST_HANDLER_QUEUE) {
    SERVER_INSTANCE.use(handler)
  }
}

export const registerHandler = (handler: RequestHandler) => {
  if (!SERVER_INSTANCE) {
    // The server hasn't started yet, so add the request handler to the queue.
    // The queue will be drained once the server has started.
    REQUEST_HANDLER_QUEUE = [...REQUEST_HANDLER_QUEUE, handler]
  } else {
    SERVER_INSTANCE.use(handler)
  }
}

export type DataFunction = (
  variables: Record<string, any>,
  {
    req,
    ctx,
  }: {
    req: GraphQLMockedRequest
    ctx: GraphQLMockedContext<Record<string, any>>
  }
) => Record<string, unknown>

const mockGraphQL = (
  type: 'query' | 'mutation',
  operation: string,
  data: DataFunction | Record<string, any>
) => {
  const resolver = (
    req: GraphQLMockedRequest,
    res: (...args: unknown[]) => unknown,
    ctx: GraphQLMockedContext<Record<string, any>>
  ) => {
    let d = data
    let responseTransforms: any[] = []

    if (typeof data === 'function') {
      // We wrap the original context return values and store them `ctxForResponse`,
      // so that we can provide them to the final `res()` call at the end of this
      // function.
      const captureTransform = <T extends Array<any>, U>(
        fn: (...args: T) => U
      ) => {
        return (...args: T): U => {
          const resTransform = fn(...args)
          responseTransforms = [...responseTransforms, resTransform]
          return resTransform
        }
      }
      const newCtx: GraphQLMockedContext<Record<string, any>> = {
        status: captureTransform(ctx.status),
        delay: captureTransform(ctx.delay),
        errors: captureTransform(ctx.errors),
        set: captureTransform(ctx.set),
        fetch: captureTransform(ctx.fetch),
        data: captureTransform(ctx.data),
      }

      d = data(req.variables, {
        req,
        ctx: newCtx,
      })
    }

    return res(ctx.data(d), ...responseTransforms)
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  registerHandler(graphql[type](operation, resolver))
  return data
}

export const mockGraphQLQuery = (
  operation: string,
  data: DataFunction | Record<string, unknown>
) => {
  return mockGraphQL('query', operation, data)
}

export const mockGraphQLMutation = (
  operation: string,
  data: DataFunction | Record<string, unknown>
) => {
  return mockGraphQL('mutation', operation, data)
}

export const mockedUserMeta: { currentUser: Record<string, unknown> | null } = {
  currentUser: null,
}

export const mockCurrentUser = (user: Record<string, unknown> | null) => {
  mockedUserMeta.currentUser = user
  mockGraphQLQuery('__REDWOOD__AUTH_GET_CURRENT_USER', () => {
    return {
      redwood: {
        currentUser: user,
      },
    }
  })
}
