import type { PrismaClient } from '@prisma/client'

export * from './clients/memcached'
export * from './clients/redis'

export interface CacheClient {
  init(): void
  get(key: string): Promise<{ value: Buffer; flags: Buffer }>
  set(key: string, value: string | Buffer, options: object): Promise<boolean>
}

export interface CacheOptions {
  expires?: number
}
export interface CacheLatestOptions extends CacheOptions {
  model?: PrismaClient
}
export type CacheKey = string
export type LatestQuery = Record<string, unknown>
export type Cacheable = () => unknown

export const createCache = (cacheClient: CacheClient) => {
  const client = cacheClient
  client.init()

  const cache = async (
    key: CacheKey,
    input: Cacheable,
    options?: CacheOptions
  ) => {
    try {
      const result = await client.get(key)

      // value will be `null` if cache MISS
      if (result?.value) {
        console.debug(`Cache HIT ${key}`)
        return JSON.parse(result.value.toString())
      }

      let data

      try {
        console.debug(`Cache MISS ${key}`)
        data = await input()
        await client.set(key, JSON.stringify(data), options || {})
        return data
      } catch (e) {
        console.error('Error in cache SET', e)
        return data || (await input())
      }
    } catch (e) {
      console.error('Error in cache GET', e)
      return await input()
    }
  }

  return {
    cache,
    cacheLatest: async (
      key: string,
      query: LatestQuery,
      options: CacheLatestOptions
    ) => {
      let cacheKey = key
      const { model, ...rest } = options
      const queryFunction = Object.keys(query)[0]
      const conditions = query[queryFunction] as object

      // take the conditions from the query that's going to be cached, and only
      // return the latest record (based on `updatedAt`) from that set of records
      // and use it as the cache key
      try {
        const latest = await model.findFirst({
          ...conditions,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, updatedAt: true },
        })
        cacheKey = `${key}-${latest.id}-${latest.updatedAt.getTime()}`

        return cache(cacheKey, () => model[queryFunction](conditions), {
          ...rest,
        })
      } catch (e) {
        console.error('Error in cacheLatest', e)
        return model[queryFunction](conditions)
      }
    },
  }
}
