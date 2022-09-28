import InMemoryClient from '../clients/InMemoryClient'
import { CacheTimeoutError } from '../errors'
import { createCache } from '../index'

describe('client.reconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attempts to reconnect on timeout error', async () => {
    const client = new InMemoryClient()
    const { cache } = createCache(client)
    const getSpy = jest.spyOn(client, 'get')
    getSpy.mockImplementation(() => {
      throw new CacheTimeoutError()
    })
    const reconnectSpy = jest.spyOn(client, 'reconnect')

    await cache('test', () => {
      return { bar: 'baz' }
    })

    // returns existing cached value, not the one that was just set
    expect(reconnectSpy).toHaveBeenCalled()
  })
})
