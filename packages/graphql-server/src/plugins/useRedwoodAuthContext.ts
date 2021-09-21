import { Plugin } from '@envelop/core'

import { getAuthenticationContext } from '@redwoodjs/api'

// import { AuthenticationError } from '../errors'
import {
  RedwoodGraphQLContext,
  GraphQLHandlerOptions,
} from '../functions/types'

/**
 * Envelop plugin for injecting the current user into the GraphQL Context,
 * based on custom getCurrentUser function.
 */
export const useRedwoodAuthContext = (
  getCurrentUser: GraphQLHandlerOptions['getCurrentUser']
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ context, extendContext }) {
      const { requestContext } = context

      let authContext = undefined

      try {
        authContext = await getAuthenticationContext({
          event: context.event,
          context: requestContext,
        })
      } catch (error: any) {
        throw new Error(
          `Unable to get authentication context: ${error.message}`
        )
      }

      try {
        if (authContext) {
          const currentUser = getCurrentUser
            ? await getCurrentUser(
                authContext[0],
                authContext[1],
                authContext[2]
              )
            : null

          extendContext({ currentUser })
        }
      } catch (error: any) {
        throw new Error(`Unable to get the current user: ${error.message}`)
      }
    },
  }
}
