import type { InMemoryClient } from '@redwoodjs/api/cache'

// Custom Jest matchers to be used with Redwood's server caching
// Just needs a global import like import '@redwoodjs/testing/cache'

expect.extend({
  toHaveCached(
    cacheClient: InMemoryClient,
    keyOrCachedValue: unknown,
    cachedValue: unknown
  ) {
    let value: unknown
    let regexKey: RegExp | undefined
    let stringKey: string | undefined
    let found = false

    // Figures out which form of this function we're calling:
    //
    // One argument, the value that's cached:
    //
    //   toHaveCached({ foo: 'bar' })
    //
    // Two arguments, the key that is caching it and the value that is cached:
    //
    //   toHaveCached('cache-key', { foo: 'bar' })

    if (keyOrCachedValue && cachedValue) {
      if (keyOrCachedValue instanceof RegExp) {
        regexKey = keyOrCachedValue
      } else {
        stringKey = keyOrCachedValue.toString()
      }
      value = cachedValue
    } else {
      value = keyOrCachedValue
    }

    const serializedValue = JSON.stringify(value)

    for (const [cachedKey, cachedValue] of Object.entries(
      cacheClient.storage
    )) {
      found =
        // key matches regular expression
        (regexKey &&
          regexKey.test(cachedKey) &&
          cachedValue.value === serializedValue) ||
        // key is exactly a string
        (stringKey &&
          cachedKey === stringKey &&
          cachedValue.value === serializedValue) ||
        // no key was passed, just match on value
        cachedValue.value === serializedValue

      if (found) {
        break
      }
    }

    if (found) {
      if (regexKey || stringKey) {
        return {
          pass: true,
          message: () =>
            `Found cached value with key \`${regexKey || stringKey}\``,
        }
      } else {
        return {
          pass: true,
          message: () => 'Found cached value',
        }
      }
    } else {
      if (regexKey || stringKey) {
        return {
          pass: false,
          message: () =>
            `Expected Cache Key \`${
              regexKey || stringKey
            }\` to match Value: ${this.utils.printExpected(
              serializedValue
            )}\n` +
            `Cache Contents: ${this.utils.printReceived(cacheClient.storage)}`,
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
