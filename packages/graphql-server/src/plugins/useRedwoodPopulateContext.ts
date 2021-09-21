import { Plugin } from '@envelop/core'

import {
  RedwoodGraphQLContext,
  GraphQLHandlerOptions,
} from '../functions/types'
/**
 * This Envelop plugin enriches the context on a per-request basis
 * by populating it with the results of a custom function
 * @returns
 */
export const useRedwoodPopulateContext = (
  populateContextBuilder: NonNullable<GraphQLHandlerOptions['context']>
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ context, extendContext }) {
      const populateContext =
        typeof populateContextBuilder === 'function'
          ? await populateContextBuilder({ context })
          : populateContextBuilder

      extendContext(populateContext)
    },
  }
}
