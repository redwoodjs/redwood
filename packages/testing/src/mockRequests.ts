// MSW is shared by Jest (NodeJS) and Storybook (Webpack)
import * as msw from 'msw'

// Allow users to call "mockGraphQLQuery" and "mockGraphQLMutation"
// before the server has started. We store the request handlers in
// a queue that is drained once the server is started.
let REQUEST_HANDLER_QUEUE: msw.RequestHandler[] = []

let SERVER_INSTANCE: any

/**
 * This will import the correct runtime (node/ browser) of MSW,
 * and start the functionality that captures requests.
 *
 * Request handlers can be registered lazily (via `mockGraphQL<Query|Mutation>`),
 * the queue will be drained and used.
 */
export const startMSW = async () => {
  if (SERVER_INSTANCE) {
    return SERVER_INSTANCE
  }

  if (typeof global.process === 'undefined') {
    const { setupWorker } = require('msw')
    SERVER_INSTANCE = setupWorker()
  } else {
    const { setupServer } = require('msw/node')
    SERVER_INSTANCE = setupServer()
  }

  await SERVER_INSTANCE.start()
  setupRequestHandlers()
  return SERVER_INSTANCE
}

export const setupRequestHandlers = () => {
  SERVER_INSTANCE.resetHandlers()
  // Register all the handlers that are stored in the queue.
  for (const handler of REQUEST_HANDLER_QUEUE) {
    SERVER_INSTANCE.use(handler)
  }
}

export const registerHandler = (handler: any) => {
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
    req: msw.GraphQLMockedRequest
    ctx: msw.GraphQLMockedContext<{}>
  }
) => {}

const mockGraphQL = (
  type: 'query' | 'mutation',
  operation: string,
  data: DataFunction | {}
) => {
  const resolver = (
    req: msw.GraphQLMockedRequest,
    res: Function,
    ctx: msw.GraphQLMockedContext<{}>
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
      const newCtx: msw.GraphQLMockedContext<{}> = {
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

  registerHandler(msw.graphql[type](operation, resolver))
  return data
}

export const mockGraphQLQuery = (
  operation: string,
  data: DataFunction | {}
) => {
  return mockGraphQL('query', operation, data)
}

export const mockGraphQLMutation = (
  operation: string,
  data: DataFunction | {}
) => {
  return mockGraphQL('mutation', operation, data)
}
