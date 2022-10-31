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

/**
 * This is just syntactic sugar, to help with testing cache contents.
 *
 * If you pass an array, it will check arrays for a partial match of the object.
 *
 * If you pass an object, it will check for a partial match
 *
 * @example
 * expect(testCacheClient.contents).toContainEqual(partialMatch({ title: 'Only look for this title'}))
 *
 * @example
 * expect(testCacheClient.contents).toContainEqual(partialMatch([{id: 1}]))
 *
 * @param value Object or Array of object to match
 */
export const partialMatch = (
  value: Record<any, any> | Array<Record<any, any>>
) => {
  return Array.isArray(value)
    ? expect.arrayContaining([expect.objectContaining(value[0])])
    : expect.objectContaining(value)
}
