import type { APIGatewayEvent, Context as LambdaContext } from 'aws-lambda'

import { getAuthenticationContext } from '@redwoodjs/api'

import {
  getAsyncStoreInstance,
  setContext,
  context as globalContext,
} from '../globalContext'

import type { GetCurrentUser } from './types'

interface Args {
  handlerFn: (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...others: any
  ) => any
  getCurrentUser: GetCurrentUser
}

export const useRequireAuth = ({ handlerFn, getCurrentUser }: Args) => {
  return async (
    event: APIGatewayEvent,
    context: LambdaContext,
    ...rest: any
  ) => {
    const authEnrichedFunction = async () => {
      try {
        const authContext = await getAuthenticationContext({ event, context })

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
        return {
          statusCode: 401,
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
