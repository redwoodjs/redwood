export default abstract class BaseClient {
  constructor() {}

  abstract get(key: string): unknown

  abstract set(
    key: string,
    value: unknown,
    options: { expires?: number | undefined }
  ): Promise<unknown>
}
