import { Plugin } from '@envelop/core'

import { RedwoodGraphQLContext } from '../functions/types'
import { setContext } from '../index'

/**
 * This Envelop plugin waits until the GraphQL context is done building and sets the
 * Redwood global context which can be imported with:
 * // import { context } from '@redwoodjs/graphql-server'
 * @returns
 */
export const useRedwoodGlobalContextSetter =
  (): Plugin<RedwoodGraphQLContext> => ({
    onContextBuilding() {
      return ({ context: redwoodGraphqlContext }) => {
        setContext(redwoodGraphqlContext)
      }
    },
  })
