import type { Reference, StoreObject } from '@apollo/client'
import { useApolloClient } from '@apollo/client'

export const useCache = () => {
  const cache = useApolloClient().cache

  const identify = (
    object: StoreObject | Reference
  ): { id: string | undefined } => {
    return { id: cache.identify(object) }
  }

  const modify = (
    object: StoreObject | Reference,
    fields: Record<string, any>
  ) => {
    return cache.modify({ ...identify(object), fields })
  }

  const evict = (object: StoreObject | Reference) => {
    return cache.evict(identify(object))
  }

  return { cache, identify, modify, evict }
}
