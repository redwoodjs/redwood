import { Client } from 'memjs'
import type { Client as ClientType, ClientOptions, ServerOptions } from 'memjs'

export class MemcachedClient {
  serversStr: string | undefined
  options: ClientOptions | ServerOptions | undefined
  client: ClientType | undefined

  constructor(serversStr?: string, options?: ClientOptions | ServerOptions) {
    this.serversStr = serversStr
    this.options = options
  }

  init() {
    this.client = Client.create(this.serversStr, this.options)
  }

  get(key: string) {
    return this.client?.get(key)
  }

  set(
    key: string,
    value: string | Buffer,
    options: { expires?: number | undefined }
  ) {
    return this.client?.set(key, value, options)
  }
}
