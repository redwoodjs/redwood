import InMemoryClient from '../clients/InMemoryClient'
import { CacheTimeoutError } from '../errors'
import { createCache } from '../index'

describe('client.disconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attempts to disconnect on timeout error', async () => {
    const client = new InMemoryClient()
    const { cache } = createCache(client)
    const getSpy = jest.spyOn(client, 'get')
    getSpy.mockImplementation(() => {
      throw new CacheTimeoutError()
    })
    const disconnectSpy = jest.spyOn(client, 'disconnect')

    await cache('test', () => {
      return { bar: 'baz' }
    })

    // returns existing cached value, not the one that was just set
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
