import type { PrismaClient } from '@prisma/client'

import type { Logger } from '../logger'

import { CacheTimeoutError } from './errors'

export * from './clients/MemcachedClient'
export * from './clients/RedisClient'

export interface CacheClient {
  get(key: string): Promise<{ value: Buffer; flags: Buffer }>
  set(key: string, value: unknown, options: object): Promise<boolean>
}

export interface CreateCacheOptions {
  logger?: Logger
  timeout?: number
  prefix?: string
  fields?: {
    id: string
    updatedAt: string
  }
}

export interface CacheOptions {
  expires?: number
}

export interface CacheFindManyOptions extends CacheOptions {
  conditions?: Record<string, unknown>
}

export type CacheKey = string | Array<string>
export type LatestQuery = Record<string, unknown>
export type Cacheable = () => unknown

const DEFAULT_LATEST_FIELDS = { id: 'id', updatedAt: 'updatedAt' }

const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const cacheKeySeparator = '-'

export const formatCacheKey = (key: CacheKey, prefix: string | undefined) => {
  let output

  if (Array.isArray(key)) {
    output = key.join(cacheKeySeparator)
  } else {
    output = key
  }

  // don't prefix if already prefixed
  if (
    prefix &&
    !output.toString().match(new RegExp('^' + prefix + cacheKeySeparator))
  ) {
    output = `${prefix}${cacheKeySeparator}${output}`
  }

  return output
}

export const createCache = (
  cacheClient: CacheClient,
  options: CreateCacheOptions | undefined
) => {
  const client = cacheClient
  const logger = options?.logger
  const timeout = options?.timeout || 1000
  const prefix = options?.prefix
  const fields = options?.fields || DEFAULT_LATEST_FIELDS

  const cache = async (
    key: CacheKey,
    input: Cacheable,
    options?: CacheOptions
  ) => {
    const cacheKey = formatCacheKey(key, prefix)

    try {
      // some client lib timeouts are flaky if the server actually goes away
      // (MemJS) so we'll implement our own here just in case
      const result = await Promise.race([
        client.get(cacheKey),
        wait(timeout).then(() => {
          throw new CacheTimeoutError()
        }),
      ])

      if (result) {
        logger?.debug(`[Cache] HIT key '${cacheKey}'`)
        return result
      }
    } catch (e: any) {
      logger?.error(`[Cache] Error GET '${cacheKey}': ${e.message}`)
      return await input()
    }

    // data wasn't found, SET it instead
    let data

    try {
      data = await input()

      await Promise.race([
        client.set(cacheKey, data, options || {}),
        wait(timeout).then(() => {
          throw new CacheTimeoutError()
        }),
      ])

      logger?.debug(
        `[Cache] MISS '${cacheKey}', SET ${JSON.stringify(data).length} bytes`
      )
      return data
    } catch (e: any) {
      logger?.error(`[Cache] Error SET '${cacheKey}': ${e.message}`)
      return data || (await input())
    }
  }

  const cacheFindMany = async (
    key: CacheKey,
    model: PrismaClient,
    options: CacheFindManyOptions = {}
  ) => {
    const { conditions, ...rest } = options
    const cacheKey = formatCacheKey(key, prefix)
    let latest, latestCacheKey

    // @ts-expect-error - Error object is not exported until `prisma generate`
    const { PrismaClientValidationError } = await import('@prisma/client')

    // take the conditions from the query that's going to be cached, and only
    // return the latest record (based on `updatedAt`) from that set of
    // records and use it as the cache key
    try {
      latest = await model.findFirst({
        ...conditions,
        orderBy: { [fields.updatedAt]: 'desc' },
        select: { [fields.id]: true, [fields.updatedAt]: true },
      })
    } catch (e: any) {
      if (e instanceof PrismaClientValidationError) {
        logger?.error(
          `[Cache] cacheFindMany error: model does not contain \`${fields.id}\` or \`${fields.updatedAt}\` fields`
        )
      } else {
        logger?.error(`[Cache] cacheFindMany error: ${e.message}`)
      }

      return model.findMany(conditions)
    }

    // there may not have been any records returned, in which case we can't
    // create the key so just return the query
    if (latest) {
      latestCacheKey = `${cacheKey}${cacheKeySeparator}${
        latest.id
      }${cacheKeySeparator}${latest[fields.updatedAt].getTime()}`
    } else {
      logger?.debug(
        `[Cache] cacheFindMany: No data to cache for key \`${key}\`, skipping`
      )

      return model.findMany(conditions)
    }

    // everything looks good, cache() this with the computed key
    return cache(latestCacheKey, () => model.findMany(conditions), rest)
  }

  return {
    cache,
    cacheFindMany,
  }
}
