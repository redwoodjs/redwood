export default abstract class BaseClient {
  constructor() {}

  // if your client won't automatically reconnect, implement this function
  // to do it manually
  reconnect?(): void

  // Gets a value from the cache
  abstract get(key: string): any

  // Sets a value in the cache. The return value will not be used.
  abstract set(
    key: string,
    value: unknown,
    options: { expires?: number }
  ): Promise<any> | undefined
}
