import type { InMemoryClient } from '@redwoodjs/api/cache'

// Custom Jest matchers to be used with Redwood's server caching
// Just needs a global import like import '@redwoodjs/testing/cache'

expect.extend({
  toHaveCached(cacheClient: InMemoryClient, value: unknown) {
    const serializedValue = JSON.stringify(value)

    const found = Object.values(cacheClient.storage)
      .map((cacheObj) => cacheObj.value)
      .some((cachedValue) => {
        return cachedValue === serializedValue
      })

    if (found) {
      return {
        pass: true,
        message: () => 'Found cached value',
      }
    } else {
      return {
        pass: false,
        message: () =>
          `Expected Cached Value: ${this.utils.printExpected(
            serializedValue
          )}\n` +
          `Cache Contents: ${this.utils.printReceived(cacheClient.storage)}`,
      }
    }
  },
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveCached(value: unknown): R
    }
  }
}
