import { Client } from 'memjs'
import type { Client as ClientType, ClientOptions, ServerOptions } from 'memjs'

import BaseClient from './BaseClient'

export default class MemcachedClient extends BaseClient {
  client: ClientType | undefined
  servers
  options

  constructor(servers: string, options?: ClientOptions & ServerOptions) {
    super()
    this.servers = servers
    this.options = options
    this.reconnect()
  }

  reconnect() {
    this.client = Client.create(this.servers, this.options)
  }

  async get(key: string) {
    const result = await this.client?.get(key)

    if (result?.value) {
      return JSON.parse(result.value.toString())
    } else {
      return result?.value
    }
  }

  set(key: string, value: unknown, options: { expires?: number }) {
    return this.client?.set(key, JSON.stringify(value), options)
  }
}
