// Simple in-memory cache client for testing. NOT RECOMMENDED FOR PRODUCTION

import BaseCacheClient from '../clients/base'

type CacheOptions = {
  expires?: number
}

export class InMemoryClient extends BaseCacheClient {
  storage: Record<string, { expires: number; value: string }>

  // initialize with pre-cached data if needed
  constructor(data = {}) {
    super()
    this.storage = data
  }

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
  set(key: string, value: unknown, options: CacheOptions = {}) {
    const now = new Date()
    now.setSeconds(now.getSeconds() + (options?.expires || 315360000))
    const data = { expires: now.getTime(), value: JSON.stringify(value) }

    this.storage[key] = data

    return true
  }
}
