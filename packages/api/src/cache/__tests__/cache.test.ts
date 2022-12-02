import InMemoryClient from '../clients/InMemoryClient'
import { createCache } from '../index'

describe('cache', () => {
  it('set(): adds a missing key to the cache', async () => {
    const client = new InMemoryClient()
    const { cache } = createCache(client)

    const result = await cache('test', () => {
      return { foo: 'bar' }
    })

    expect(result).toEqual({ foo: 'bar' })
    expect(client.storage.test.value).toEqual(JSON.stringify({ foo: 'bar' }))
  })

  it('get(): finds an existing key in the cache', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { cache } = createCache(client)

    const result = await cache('test', () => {
      return { bar: 'baz' }
    })

    // returns existing cached value, not the one that was just set
    expect(result).toEqual({ foo: 'bar' })
  })

  it('delete(): deletes a key from the cache', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    await deleteCacheKey('test')

    // returns existing cached value, not the one that was just set
    expect(client.storage['test']).toEqual(undefined)
  })

  it('delete(): returns true if key was deleted', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    const result = await deleteCacheKey('test')

    // returns existing cached value, not the one that was just set
    expect(result).toEqual(true)
  })

  it('delete(): returns false if key did not exist', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    const result = await deleteCacheKey('foobar')

    // returns existing cached value, not the one that was just set
    expect(result).toEqual(false)
  })
})
