import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

import OgImageMiddleware from './OgImageMiddleware'

// Mock getRoutesList function
vi.mock('./getRoutesList', () => ({
  getRoutesList: vi.fn().mockResolvedValue([]),
}))

describe('OgImageMiddleware', () => {
  let middleware: OgImageMiddleware

  beforeEach(() => {
    const options = {
      App: vi.fn(),
      Document: vi.fn(),
    }
    middleware = new OgImageMiddleware(options)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('invoke should return mwResponse if not a file request', async () => {
    const req = { url: 'http://example.com' }
    const mwResponse = {}
    const invokeOptions = {}

    const result = await middleware.invoke(req, mwResponse, invokeOptions)

    expect(result).toBe(mwResponse)
  })

  test('invoke should return a pass through mwResponse if no match with the router', async () => {
    const req = { url: 'http://example.com/file.png' }
    const mwResponse = {
      passthrough: 'yeah',
    }
    const invokeOptions = {}

    const result = await middleware.invoke(req, mwResponse, invokeOptions)

    expect(result).toBe(mwResponse)
  })

  test('invoke should return mwResponse if not a supported extension', async () => {
    const req = { url: 'http://example.com/file.txt' }
    const mwResponse = {
      passthrough: 'yeah',
    }

    const invokeOptions = {}

    const result = await middleware.invoke(req, mwResponse, invokeOptions)

    expect(result).toBe(mwResponse)
  })

  // Add more tests for other scenarios
})
