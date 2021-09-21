import { Plugin } from '@envelop/core'

import { getAuthenticationContext } from '@redwoodjs/api'

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

      const authContext = await getAuthenticationContext({
        event: context.event,
        context: requestContext,
      })

      if (authContext) {
        const currentUser = getCurrentUser
          ? await getCurrentUser(authContext[0], authContext[1], authContext[2])
          : authContext

        extendContext({ currentUser })
      }
    },
  }
}
