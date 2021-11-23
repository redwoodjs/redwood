import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { getAuthenticationContext } from '@redwoodjs/api'

import {
  getAsyncStoreInstance,
  setContext,
  context as globalContext,
} from '../globalContext'

import type { GetCurrentUser } from './types'

export const useRequireAuth = ({
  handlerFn,
  getCurrentUser,
}: {
  handlerFn: any
  getCurrentUser: GetCurrentUser
}) => {
  return (
    event: APIGatewayProxyEvent,
    context: LambdaContext,
    ...rest: any
  ): Promise<any> => {
    const execFn = async ({
      handlerFn,
      getCurrentUser,
    }: {
      handlerFn: any
      getCurrentUser: GetCurrentUser
    }) => {
      try {
        let authContext = undefined

        authContext = await getAuthenticationContext({
          event: handlerFn.event,
          context: handlerFn.context,
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

          setContext(globalContext)
        }

        return await handlerFn(event, context, ...rest)
      } catch (e) {
        console.error(e)

        throw e
      }
    }

    if (getAsyncStoreInstance()) {
      // This must be used when you're self-hosting RedwoodJS.
      return getAsyncStoreInstance().run(new Map(), execFn, {
        handlerFn,
        getCurrentUser,
      })
    } else {
      // This is OK for AWS (Netlify/Vercel) because each Lambda request
      // is handled individually.
      return execFn({ handlerFn, getCurrentUser })
    }
  }
}
