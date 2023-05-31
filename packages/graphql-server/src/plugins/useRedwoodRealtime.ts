import type { Plugin } from '@envelop/core'
import type { UseLiveQueryOptions } from '@envelop/live-query'
import { useLiveQuery } from '@envelop/live-query'
import { mergeSchemas } from '@graphql-tools/schema'
import { astFromDirective } from '@graphql-tools/utils'
import type { PubSub } from '@graphql-yoga/subscription'
import { createPubSub } from '@graphql-yoga/subscription'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { print } from 'graphql'

import type { SubscriptionGlobImports } from 'src/subscriptions/makeSubscriptions'

export type { PubSub }

export { createPubSub, InMemoryLiveQueryStore }

export const liveDirectiveTypeDefs = print(
  astFromDirective(GraphQLLiveDirective)
)

export type RedwoodRealtimeOptions = {
  liveQueries?: UseLiveQueryOptions
  /**
   * @description Subscriptions passed from the glob import:
   * import subscriptions from 'src/subscriptions/**\/*.{js,ts}'
   */
  subscriptions?: {
    subscriptions: SubscriptionGlobImports
    pubSub: ReturnType<typeof createPubSub>
  }
}

export const useRedwoodRealtime = (options: RedwoodRealtimeOptions): Plugin => {
  if (options.liveQueries?.liveQueryStore) {
    const liveQueryPlugin = useLiveQuery({
      liveQueryStore: options.liveQueries.liveQueryStore,
    })

    /**
     * This symbol is added to the schema extensions for checking whether the live query was added to the schema only once.
     */
    const wasLiveQueryAdded = Symbol.for('useRedwoodRealtime.wasLiveQueryAdded')

    return {
      onSchemaChange({ replaceSchema, schema }) {
        if (schema.extensions?.[wasLiveQueryAdded] === true) {
          return
        }

        const liveSchema = mergeSchemas({
          schemas: [schema],
          typeDefs: [liveDirectiveTypeDefs],
        })

        liveSchema.extensions = {
          ...schema.extensions,
          [wasLiveQueryAdded]: true,
        }

        replaceSchema(liveSchema)
      },
      onPluginInit({ addPlugin }) {
        addPlugin(liveQueryPlugin)
      },
      onContextBuilding() {
        return ({ extendContext }) => {
          extendContext({
            liveQueryStore: options.liveQueries?.liveQueryStore,
            pubSub: options.subscriptions?.pubSub as ReturnType<
              typeof createPubSub
            >,
          })
        }
      },
    }
  }
  return {}
}
