import type { Plugin } from '@envelop/core'
import type { UseLiveQueryOptions } from '@envelop/live-query'
import { useLiveQuery } from '@envelop/live-query'
import { mergeSchemas } from '@graphql-tools/schema'
import { astFromDirective } from '@graphql-tools/utils'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { print } from 'graphql'

export { InMemoryLiveQueryStore }

export const liveDirectiveTypeDefs = print(
  astFromDirective(GraphQLLiveDirective)
)

/**
 * Example usage in a Redwood app
 *
 * ```ts
 * import { liveQueryStore } from 'src/lib/realtime'
 *
 * export const liveQueryPlugin = useRedwoodLiveQuery({ liveQueryStore })
 *
 * ```
 */

export const useRedwoodLiveQuery = (options: UseLiveQueryOptions): Plugin => {
  const liveQueryPlugin = useLiveQuery({
    liveQueryStore: options.liveQueryStore,
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
  }
}
