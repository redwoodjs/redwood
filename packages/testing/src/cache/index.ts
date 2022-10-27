import type { InMemoryClient } from '@redwoodjs/api/cache'

// Custom Jest matchers to be used with Redwood's server caching
// Just needs a global import like import '@redwoodjs/testing/cache'

expect.extend({
  // TODO: add support for expect(cacheClient).not.toHaveCached(x)
  toHaveCached(cacheClient: InMemoryClient, value: unknown) {
    const cacheValues = Object.values(cacheClient.storage).map((cacheObj) =>
      JSON.parse(cacheObj.value)
    )

    // TODO: Is this assumption correct?
    // If an array is passed, we know they're trying to check a nested value in an array
    const checkType = Array.isArray(value)
      ? expect.arrayContaining([expect.objectContaining(value[0])])
      : expect.objectContaining(value)

    try {
      expect(cacheValues).toContainEqual(checkType)
      return {
        pass: true,
        message: () => 'Found cached value',
      }
    } catch (e) {
      return {
        pass: false,
        message: () =>
          `Expected Cached Value: ${this.utils.printExpected(
            JSON.stringify(value) // print the serialized value
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
