import type { Plugin } from '@envelop/core'
// import type { UseLiveQueryOptions } from '@envelop/live-query'
import { useLiveQuery } from '@envelop/live-query'
import { mergeSchemas } from '@graphql-tools/schema'
import { astFromDirective } from '@graphql-tools/utils'
import type { PubSub } from '@graphql-yoga/subscription'
import { createPubSub } from '@graphql-yoga/subscription'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { execute as defaultExecute, print } from 'graphql'

import type { SubscriptionGlobImports } from 'src/subscriptions/makeSubscriptions'

export type { PubSub }

export { createPubSub, InMemoryLiveQueryStore }

export const liveDirectiveTypeDefs = print(
  astFromDirective(GraphQLLiveDirective)
)

export type LiveQueryStorageMechanism =
  | RedisLiveQueryStore
  | InMemoryLiveQueryStore

export type RedwoodRealtimeOptions = {
  // liveQueries: { store: RedisLiveQueryStore | InMemoryLiveQueryStore }
  liveQueries: {
    store:
      | 'in-memory'
      | {
          redis: {
            channel?: string
            publishClient: LiveQueryRedisClient
            subscribeClient: LiveQueryRedisClient
          }
        }
  }
  /**
   * @description Subscriptions passed from the glob import:
   * import subscriptions from 'src/subscriptions/**\/*.{js,ts}'
   */
  subscriptions?: {
    subscriptions: SubscriptionGlobImports
    pubSub: ReturnType<typeof createPubSub>
  }
}

export interface LiveQueryRedisClient {
  connect(): Promise<void>
  set(key: string, value: string): Promise<void | string>
  get(key: string): Promise<string | null>
  publish(channel: string, message: string): Promise<number>
  subscribe(
    channel: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void
  ): Promise<void | unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void
  // Add other methods that you need
}

export class RedisLiveQueryStore {
  pub: LiveQueryRedisClient
  sub: LiveQueryRedisClient
  channel: string
  liveQueryStore: InMemoryLiveQueryStore

  constructor(
    pub: LiveQueryRedisClient,
    sub: LiveQueryRedisClient,
    channel: string,
    liveQueryStore: InMemoryLiveQueryStore
  ) {
    this.pub = pub
    this.sub = sub
    this.liveQueryStore = liveQueryStore
    this.channel = channel

    this.sub.subscribe(this.channel, (err) => {
      if (err) {
        throw err
      }
    })

    this.sub.on('message', (channel, resourceIdentifier) => {
      if (channel === this.channel && resourceIdentifier) {
        this.liveQueryStore.invalidate(resourceIdentifier)
      }
    })
  }

  async invalidate(identifiers: Array<string> | string) {
    if (typeof identifiers === 'string') {
      identifiers = [identifiers]
    }
    for (const identifier of identifiers) {
      this.pub.publish(this.channel, identifier)
    }
  }

  makeExecute(execute: typeof defaultExecute) {
    return this.liveQueryStore.makeExecute(execute)
  }
}

export const useRedwoodRealtime = (options: RedwoodRealtimeOptions): Plugin => {
  if (options.liveQueries && options.liveQueries.store) {
    let liveQueryPlugin = {} as Plugin
    let liveQueryStorageMechanism = {} as LiveQueryStorageMechanism
    const inMemoryLiveQueryStore = new InMemoryLiveQueryStore()

    if (options.liveQueries.store === 'in-memory') {
      liveQueryStorageMechanism = inMemoryLiveQueryStore
      liveQueryPlugin = useLiveQuery({
        liveQueryStore: liveQueryStorageMechanism,
      })
    } else if (options.liveQueries.store.redis) {
      liveQueryStorageMechanism = new RedisLiveQueryStore(
        options.liveQueries.store.redis.publishClient,
        options.liveQueries.store.redis.subscribeClient,
        options.liveQueries.store.redis.channel || 'live-query-invalidations',
        inMemoryLiveQueryStore
      ) as unknown as InMemoryLiveQueryStore
      liveQueryPlugin = useLiveQuery({
        liveQueryStore: liveQueryStorageMechanism,
      })
    } else {
      throw new Error('Invalid live query store configuration.')
    }

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
            liveQueryStore: liveQueryStorageMechanism,
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
