import type { PrismaClient } from '@prisma/client'

import type { Logger } from '../logger'

export * from './clients/memcached'
export * from './clients/redis'

export class CacheTimeoutError extends Error {
  constructor() {
    super('Timed out waiting for response from the cache server')
    this.name = 'CacheTimeoutError'
  }
}

export interface CacheClient {
  get(key: string): Promise<{ value: Buffer; flags: Buffer }>
  set(key: string, value: unknown, options: object): Promise<boolean>
}

export interface CreateCacheOptions {
  logger?: Logger
  timeout?: number
}

export interface CacheOptions {
  expires?: number,
}

export interface CacheLatestOptions extends CacheOptions {
  model?: PrismaClient
}

export type CacheKey = string
export type LatestQuery = Record<string, unknown>
export type Cacheable = () => unknown

const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const createCache = (
  cacheClient: CacheClient,
  options: CreateCacheOptions | undefined
) => {
  const client = cacheClient
  const logger = options?.logger
  const timeout = options?.timeout || 1000

  const cache = async (
    key: CacheKey,
    input: Cacheable,
    options?: CacheOptions
  ) => {
    try {
      // some client lib timeouts are flaky if the server actually goes away
      // (MemJS) so we'll implement our own here just in case
      const result = await Promise.race([
        client.get(key),
        wait(timeout).then(() => {
          throw new CacheTimeoutError
        })
      ])

      if (result) {
        logger?.debug(`[Cache] HIT key '${key}'`)
        return result
      }
    } catch (e: any) {
      // error occurred, just return the input function as if the cache didn't
      // even exist
      logger?.error(`[Cache] Error GET '${key}': ${e.message}`)
      return await input()
    }

    // data wasn't found, SET it instead
    let data

    try {
      data = await input()

      await Promise.race([
        client.set(key, data, options || {}),
        wait(timeout).then(() => {
          throw new CacheTimeoutError()
        }),
      ])

      logger?.debug(
        `[Cache] MISS '${key}', SET ${JSON.stringify(data).length} bytes`
      )
      return data
    } catch (e: any) {
      logger?.error(`[Cache] Error SET '${key}': ${e.message}`)
      return data || (await input())
    }
  }

  const cacheLatest = async (
    key: string,
    query: LatestQuery,
    options: CacheLatestOptions
  ) => {
    let cacheKey = key
    const { model, ...rest } = options
    const queryFunction = Object.keys(query)[0]
    const conditions = query[queryFunction] as object

    // take the conditions from the query that's going to be cached, and only
    // return the latest record (based on `updatedAt`) from that set of
    // records and use it as the cache key
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
    } catch (e: any) {
      logger?.error('Error in cacheLatest', e.message)
      return model[queryFunction](conditions)
    }
  }

  return {
    cache,
    cacheLatest,
  }
}
