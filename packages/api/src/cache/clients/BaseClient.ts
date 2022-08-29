export default class BaseClient {
  constructor() {
    // Implement with client setup code. Add whatever arguments you want.
  }

  get(_key: string) {
    // Implement with client-specific cache retrieval code. Arguments should not change.
  }

  set(
    _key: string,
    _value: unknown,
    _options: { expires?: number | undefined }
  ) {
    // Implement with client-specific cache storage code. Arguments should not change.
  }
}
