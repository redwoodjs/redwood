import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations'
import type { Plugin } from 'graphql-yoga'

import type { RedwoodGraphQLContext } from '../types'

export type RedwoodPersistedOperationsOptions = {
  store: Record<string, string>
  disabled?: boolean
}

export const useRedwoodPersistedOperations = (
  options: RedwoodPersistedOperationsOptions
): Plugin<RedwoodGraphQLContext> => {
  return usePersistedOperations({
    getPersistedOperation(sha256Hash: string) {
      return options.store[sha256Hash]
    },
  })
}
