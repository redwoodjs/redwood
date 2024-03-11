import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations'
import type { CustomPersistedQueryErrors } from '@graphql-yoga/plugin-persisted-operations'
import type { Plugin } from 'graphql-yoga'

import type { RedwoodGraphQLContext } from '../types'

export type RedwoodTrustedDocumentOptions = {
  store: Record<string, string>
  disabled?: boolean
  customErrors?: CustomPersistedQueryErrors
}

export const useRedwoodTrustedDocuments = (
  options: RedwoodTrustedDocumentOptions,
): Plugin<RedwoodGraphQLContext> => {
  return usePersistedOperations({
    customErrors: {
      persistedQueryOnly: 'Use Trusted Only!',
      ...options.customErrors,
    },
    getPersistedOperation(sha256Hash: string) {
      return options.store[sha256Hash]
    },
  })
}
