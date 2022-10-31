// Simple in-memory cache client for testing. NOT RECOMMENDED FOR PRODUCTION

import BaseClient from './BaseClient'

type CacheOptions = {
  expires?: number
}

export default class InMemoryClient extends BaseClient {
  storage: Record<string, { expires: number; value: string }>

  // initialize with pre-cached data if needed
  constructor(data = {}) {
    super()
    this.storage = data
  }

  /**
   * Special function for testing, only available in InMemoryClient
   *
   * Returns parsed content of cache as an array of values (no cache keys)
   *
   */
  get contents() {
    return Object.values(this.storage).map((cacheObj) =>
      JSON.parse(cacheObj.value)
    )
  }

  // Not needed for InMemoryClient
  async disconnect() {}
  async connect() {}

  async get(key: string) {
    const now = new Date()
    if (this.storage[key] && this.storage[key].expires > now.getTime()) {
      return JSON.parse(this.storage[key].value)
    } else {
      delete this.storage[key]
      return null
    }
  }

  // stores expiration dates as epoch
  async set(key: string, value: unknown, options: CacheOptions = {}) {
    const now = new Date()
    now.setSeconds(now.getSeconds() + (options?.expires || 315360000))
    const data = { expires: now.getTime(), value: JSON.stringify(value) }

    this.storage[key] = data

    return true
  }

  /**
   * Special clear function for testing
   * only available in InMemoryClient
   */
  async clear() {
    this.storage = {}
  }

  // Testing helpers
  // @TODO: Rob you added this, but maybe forgot to use?
  // Do we still need this?
  cacheKeyForValue(value: any) {
    for (const [cacheKey, cacheObj] of Object.entries(this.storage)) {
      if (cacheObj.value === JSON.stringify(value)) {
        return cacheKey
      }
    }

    return null
  }

  isCached(value: any) {
    return !!this.cacheKeyForValue(value)
  }
}
