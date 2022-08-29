import { createClient } from 'redis'
import type { RedisClientOptions } from 'redis'

import BaseClient from './BaseClient'

interface SetOptions {
  EX?: number
}

export class RedisClient extends BaseClient {
  client

  constructor(options: RedisClientOptions) {
    super()
    this.client = createClient(options)
    this.client.connect()
  }

  async get(key: string) {
    const result = await this.client.get(key)

    return result ? JSON.parse(result) : null
  }

  set(key: string, value: unknown, options: { expires?: number | undefined }) {
    const setOptions: SetOptions = {}

    if (options.expires) {
      setOptions.EX = options.expires
    }

    return this.client.set(key, JSON.stringify(value), setOptions)
  }
}
