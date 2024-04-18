import { vol, fs as memfs } from 'memfs'
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

import type { RWRouteManifestItem } from '@redwoodjs/internal'

import OgImageMiddleware from './OgImageMiddleware'

// Memfs mocks the redwood project-config stuff
vi.mock('fs', () => ({ ...memfs, default: { ...memfs } }))
vi.mock('node:fs', () => ({ ...memfs, default: { ...memfs } }))

// Mock getRoutesList function
vi.mock('./getRoutesList', () => ({
  getRoutesList: vi.fn().mockResolvedValue([]),
}))

describe('OgImageMiddleware', () => {
  let middleware: OgImageMiddleware
  let original_RWJS_CWD: string | undefined

  beforeEach(() => {
    const options = {
      App: vi.fn(),
      Document: vi.fn(),
    }
    middleware = new OgImageMiddleware(options)

    original_RWJS_CWD = process.env.RWJS_CWD
    process.env.RWJS_CWD = '/redwood-app'
    // Mock the file system using memfs
    vol.fromJSON(
      {
        'redwood.toml': '',
        'web/src/pages/Contact/ContactPage.jsx': 'ContactPage',
        'web/src/pages/Contact/ContactPage.png.jsx': 'ContactOG',
      },
      '/redwood-app',
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
    process.env.RWJS_CWD = original_RWJS_CWD
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

  test('getOgComponentPath should return the correct OG image file path', async () => {
    const commonRouteInfo = {
      name: 'contact',
      bundle: 'assets/ContactPage-DjZx8IRT.js',
      matchRegexString: '^/contacts/(\\d+)$',
      pathDefinition: '/contacts/{id:Int}',
      hasParams: true,
      routeHooks: null,
      redirect: null,
    }

    const tsxRoute: RWRouteManifestItem = {
      ...commonRouteInfo,
      relativeFilePath: 'pages/Contact/ContactPage/ContactPage.tsx',
    }

    const jsxRoute: RWRouteManifestItem = {
      ...commonRouteInfo,
      relativeFilePath: 'pages/Contact/ContactPage/ContactPage.jsx',
    }

    const extension = 'png'
    const expectedFilePath =
      '/redwood-app/web/dist/server/ogImage/pages/Contact/ContactPage/ContactPage.png.mjs'

    const tsxResult = OgImageMiddleware.getOgComponentPath(tsxRoute, extension)
    const jsxResult = OgImageMiddleware.getOgComponentPath(jsxRoute, extension)

    expect(tsxResult).toBe(expectedFilePath)
    expect(jsxResult).toBe(expectedFilePath)
  })

  test('importComponent should import the component using viteDevServer', async () => {
    const filePath = '/path/to/component.js'
    const invokeOptions = {
      viteDevServer: {
        ssrLoadModule: vi.fn().mockResolvedValue({
          data: 'some data',
          output: 'Component output',
        }),
      },
    }

    const result = await OgImageMiddleware.importComponent(
      filePath,
      invokeOptions,
    )

    expect(result).toEqual({
      data: 'some data',
      Component: 'Component output',
    })
    expect(invokeOptions.viteDevServer.ssrLoadModule).toHaveBeenCalledWith(
      filePath,
    )
  })

  test('importComponent should import the component using import', async () => {
    const filePath = '/path/to/component.js'
    const invokeOptions = {}

    vi.mock('/path/to/component.js', () => ({
      data: () => 'mocked data function',
      output: () => 'Mocked component render',
    }))

    const result = await OgImageMiddleware.importComponent(
      filePath,
      invokeOptions,
    )

    expect(result.data()).toBe('mocked data function')
    expect(result.Component()).toBe('Mocked component render')
  })
})
