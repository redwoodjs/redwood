import type { APIGatewayEvent, Context as LambdaContext } from 'aws-lambda'

import { getAuthenticationContext, Decoder } from '@redwoodjs/api'

import {
  getAsyncStoreInstance,
  context as globalContext,
} from '../globalContext'

import type { GetCurrentUser } from './types'

interface Args {
  authDecoder: Decoder
  handlerFn: (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...others: any
  ) => any
  getCurrentUser?: GetCurrentUser
}

// Used for type safety in our tests
export type UseRequireAuth = (
  args: Args
) => (
  event: APIGatewayEvent,
  context: LambdaContext,
  ...rest: any
) => Promise<ReturnType<Args['handlerFn']>>

export const useRequireAuth: UseRequireAuth = ({
  authDecoder,
  handlerFn,
  getCurrentUser,
}) => {
  return async (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...rest: any
  ) => {
    const authEnrichedFunction = async () => {
      try {
        const authContext = await getAuthenticationContext({
          authDecoder,
          event,
          context,
        })

        if (authContext) {
          const currentUser = getCurrentUser
            ? await getCurrentUser(
                authContext[0],
                authContext[1],
                authContext[2]
              )
            : null

          globalContext.currentUser = currentUser
        }
      } catch (e) {
        globalContext.currentUser = null

        if (process.env.NODE_ENV === 'development') {
          console.warn('This warning is only printed in development mode.')
          console.warn(
            "Always make sure to have `requireAuth('role')` inside your own handler function."
          )
          console.warn('')
          console.warn(e)
        }
      }

      return await handlerFn(event, context, ...rest)
    }

    if (getAsyncStoreInstance()) {
      // This must be used when you're self-hosting RedwoodJS.
      return getAsyncStoreInstance().run(new Map(), authEnrichedFunction)
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      return await authEnrichedFunction()
    }
  }
}
