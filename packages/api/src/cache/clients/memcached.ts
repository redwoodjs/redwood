import { Client } from 'memjs'
import type { Client as ClientType, ClientOptions, ServerOptions } from 'memjs'

export class MemcachedClient {
  client: ClientType

  constructor(serversStr: string, options?: ClientOptions & ServerOptions) {
    this.client = Client.create(serversStr, options)
  }

  async get(key: string) {
    const result = await this.client?.get(key)

    if (result?.value) {
      return JSON.parse(result.value.toString())
    } else {
      return result?.value
    }
  }

  set(key: string, value: unknown, options: { expires?: number | undefined }) {
    return this.client?.set(key, JSON.stringify(value), options)
  }
}
