import InMemoryClient from '../clients/InMemoryClient'
import { createCache } from '../index'

describe('deleteCacheKey', () => {
  it('deletes a key from the cache', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    await deleteCacheKey('test')

    // returns existing cached value, not the one that was just set
    expect(client.storage['test']).toEqual(undefined)
  })

  it('returns true if key was deleted', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    const result = await deleteCacheKey('test')

    // returns existing cached value, not the one that was just set
    expect(result).toEqual(true)
  })

  it('returns false if key did not exist', async () => {
    const client = new InMemoryClient({
      test: { expires: 1977175194415, value: '{"foo":"bar"}' },
    })
    const { deleteCacheKey } = createCache(client)

    const result = await deleteCacheKey('foobar')

    // returns existing cached value, not the one that was just set
    expect(result).toEqual(false)
  })
})
