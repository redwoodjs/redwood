import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations'
import type { Plugin } from 'graphql-yoga'

import type { RedwoodGraphQLContext } from '../types'

export type RedwoodTrustedDocumentOptions = {
  store: Record<string, string>
  disabled?: boolean
}

export const useRedwoodTrustedDocuments = (
  options: RedwoodTrustedDocumentOptions
): Plugin<RedwoodGraphQLContext> => {
  return usePersistedOperations({
    getPersistedOperation(sha256Hash: string) {
      return options.store[sha256Hash]
    },
  })
}
