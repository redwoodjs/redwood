import { Plugin } from '@envelop/core'

import {
  RedwoodGraphQLContext,
  GraphQLHandlerOptions,
} from '../functions/types'
import { getAuthenticationContext } from '../index'

/**
 * Envelop plugin for injecting the current user into the GraphQL Context,
 * based on custom getCurrentUser function.
 */
export const useRedwoodAuthContext = (
  getCurrentUser: GraphQLHandlerOptions['getCurrentUser']
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ context, extendContext }) {
      const lambdaContext = context.context as any

      const authContext = await getAuthenticationContext({
        event: context.event,
        context: lambdaContext,
      })

      if (authContext) {
        const currentUser = getCurrentUser
          ? await getCurrentUser(authContext[0], authContext[1], authContext[2])
          : authContext

        lambdaContext.currentUser = currentUser
      }

      // TODO: Maybe we don't need to spread the entire object here? since it's already there
      extendContext(lambdaContext)
    },
  }
}
