import { createClient } from 'redis'
import type { RedisClientOptions } from 'redis'

import type { Logger } from '../../logger'

import BaseClient from './BaseClient'

interface SetOptions {
  EX?: number
}

type LoggerOptions = {
  logger?: Logger
}

export default class RedisClient extends BaseClient {
  client

  constructor(options: RedisClientOptions & LoggerOptions) {
    const { logger, ...redisOptions } = options

    super()
    this.client = createClient(redisOptions)
    this.client.on('error', (err) => logger?.error(err) || console.error(err))
    this.client.connect()
  }

  async get(key: string) {
    const result = await this.client.get(key)

    return result ? JSON.parse(result) : null
  }

  set(key: string, value: unknown, options: { expires?: number }) {
    const setOptions: SetOptions = {}

    if (options.expires) {
      setOptions.EX = options.expires
    }

    return this.client.set(key, JSON.stringify(value), setOptions)
  }
}
