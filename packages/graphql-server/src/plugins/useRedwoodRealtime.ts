import type { Plugin } from '@envelop/core'
import type { UseLiveQueryOptions } from '@envelop/live-query'
import { useLiveQuery } from '@envelop/live-query'
import { mergeSchemas } from '@graphql-tools/schema'
import { astFromDirective } from '@graphql-tools/utils'
import { createPubSub } from '@graphql-yoga/subscription'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { print } from 'graphql'

export { createPubSub, InMemoryLiveQueryStore }

export const liveDirectiveTypeDefs = print(
  astFromDirective(GraphQLLiveDirective)
)

/**
 * Example usage in a Redwood app
 *
 * ```ts
 * import { liveQueryStore } from 'src/lib/realtime'
 *
 * export const liveQueryPlugin = useRedwoodRealtime({ liveQueryStore })
 *
 * ```
 */

export type pubSubType = ReturnType<typeof createPubSub>

export type RedwoodRealtimeOptions = {
  liveQueries?: UseLiveQueryOptions
  subscriptions?: { pubSub: pubSubType }
}

export const useRedwoodRealtime = (options: RedwoodRealtimeOptions): Plugin => {
  if (options.liveQueries?.liveQueryStore) {
    const liveQueryPlugin = useLiveQuery({
      liveQueryStore: options.liveQueries.liveQueryStore,
    })

    return {
      onSchemaChange({ schema }) {
        mergeSchemas({
          schemas: [schema],
          typeDefs: [liveDirectiveTypeDefs],
        })
      },
      onPluginInit({ addPlugin }) {
        addPlugin(liveQueryPlugin)
      },
      onContextBuilding() {
        return ({ extendContext }) => {
          extendContext({
            liveQueryStore: options.liveQueries?.liveQueryStore,
            pubSub: options.subscriptions?.pubSub,
          })
        }
      },
    }
  }
  return {}
}
