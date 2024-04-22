import path from 'node:path'

import React from 'react'

import { vol, fs as memfs } from 'memfs'
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { ensurePosixPath } from '@redwoodjs/project-config'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

import OgImageMiddleware from './OgImageMiddleware'

// Memfs mocks the redwood project-config stuff
vi.mock('fs', () => ({ ...memfs, default: { ...memfs } }))
vi.mock('node:fs', () => ({ ...memfs, default: { ...memfs } }))

// Mock getRoutesList function
vi.mock('./getRoutesList', () => ({
  getRoutesList: vi.fn().mockResolvedValue([
    {
      name: 'contact',
      bundle: 'assets/ContactPage-DjZx8IRT.js',
      matchRegexString: '^/contacts/(\\d+)$',
      pathDefinition: '/contacts/{id:Int}',
      hasParams: true,
      redirect: null,
      relativeFilePath: 'pages/Contact/ContactPage/ContactPage.tsx',
    },
    {
      name: 'home',
      bundle: null,
      matchRegexString: '^/$',
      pathDefinition: '/',
      hasParams: false,
      routeHooks: null,
      redirect: null,
      relativeFilePath: 'pages/HomePage/HomePage.tsx',
    },
  ]),
}))

const setContentMock = vi.fn()
const goToMock = vi.fn()
vi.mock('playwright', () => {
  return {
    chromium: {
      launch: vi.fn().mockResolvedValue({
        close: vi.fn(),
        newPage: vi.fn().mockResolvedValue({
          goto: goToMock,
          setContent: setContentMock,
          screenshot: vi.fn().mockResolvedValue('FAKE_IMAGE_CONTENT'),
        }),
      }),
    },
  }
})

describe('OgImageMiddleware', () => {
  let middleware: OgImageMiddleware
  let original_RWJS_CWD: string | undefined

  beforeEach(() => {
    const options = {
      App: ({ children }) =>
        React.createElement('div', { id: 'app' }, children),
      Document: ({ children }) =>
        React.createElement('div', { id: 'document' }, children),
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

  test('invoke should return bypass response if not a supported extension', async () => {
    const req = { url: 'http://example.com/favicon.ico' }
    const mwResponse = {
      passthrough: 'yeah',
    }

    const invokeOptions = {}

    const result = await middleware.invoke(req, mwResponse, invokeOptions)

    expect(result).toBe(mwResponse)
  })

  test('invoke should passthrough a response if the component file does not exist', async () => {
    const req = { url: 'http://example.com/contact/1.png' }
    const passthroughRes = {
      passthrough: 'yeah',
    }
    const invokeOptions = {}

    const result = await middleware.invoke(req, passthroughRes, invokeOptions)

    expect(result).toEqual(passthroughRes)
  })

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
      relativeFilePath: path.join(
        'pages',
        'Contact',
        'ContactPage',
        'ContactPage.tsx',
      ),
    }

    const jsxRoute: RWRouteManifestItem = {
      ...commonRouteInfo,
      relativeFilePath: path.join(
        'pages',
        'Contact',
        'ContactPage',
        'ContactPage.jsx',
      ),
    }

    const extension = 'png'
    const expectedFilePath =
      '/redwood-app/web/dist/server/ogImage/pages/Contact/ContactPage/ContactPage.png.mjs'

    const tsxResult = middleware.getOgComponentPath(tsxRoute, extension)
    const jsxResult = middleware.getOgComponentPath(jsxRoute, extension)

    expect(ensurePosixPath(tsxResult)).toBe(expectedFilePath)
    expect(ensurePosixPath(jsxResult)).toBe(expectedFilePath)
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

    const result = await middleware.importComponent(filePath, invokeOptions)

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

    const result = await middleware.importComponent(filePath, invokeOptions)

    expect(result.data()).toBe('mocked data function')
    expect(result.Component()).toBe('Mocked component render')
  })

  // Full flow tests!
  test('invoke should call playwright setContent with the correct params for "/contact/555"', async () => {
    const req = { url: 'https://example.com/contacts/555.png?bazinga=kittens' }
    const mwResponse = MiddlewareResponse.next()
    const invokeOptions = {}

    // The memfs mocks don't seem to work for this file

    vi.mock(
      '/redwood-app/web/dist/server/ogImage/pages/Contact/ContactPage/ContactPage.png.mjs',
      () => ({
        data: () => 'mocked data function',
        output: () => 'Mocked component render',
      }),
    )

    await middleware.invoke(req, mwResponse, invokeOptions)

    expect(goToMock).toHaveBeenCalledWith('https://example.com')
    // Notice the nesting here! Wrapping everything in Document and App
    // allows us to reuse the project's CSS setup!
    expect(setContentMock).toHaveBeenCalledWith(
      '<div id="document"><div id="app">Mocked component render</div></div>',
    )

    expect(mwResponse.body).toBe('FAKE_IMAGE_CONTENT')
    expect(mwResponse.headers.get('Content-Type')).toBe('image/png')
  })

  test('handles index og images', async () => {
    const req = { url: 'https://www.darkmatter.berlin/index.jpg' }
    const mwResponse = MiddlewareResponse.next()
    const invokeOptions = {}

    // The memfs mocks don't seem to work for this file
    vi.mock(
      '/redwood-app/web/dist/server/ogImage/pages/HomePage/HomePage.jpg.mjs',
      () => ({
        data: () => 'mocked data function',
        output: () => 'Mocked component render',
      }),
    )

    await middleware.invoke(req, mwResponse, invokeOptions)

    expect(goToMock).toHaveBeenCalledWith('https://www.darkmatter.berlin')
    // Notice the nesting here! Wrapping everything in Document and App
    // allows us to reuse the project's CSS setup!
    expect(setContentMock).toHaveBeenCalledWith(
      '<div id="document"><div id="app">Mocked component render</div></div>',
    )

    expect(mwResponse.body).toBe('FAKE_IMAGE_CONTENT')
    expect(mwResponse.headers.get('Content-Type')).toBe('image/jpeg')
  })

  test('Debug Mode: Appending ?debug param will render HTML instead!', async () => {
    const req = { url: 'https://bazinga.kittens/index.png?debug=true' }
    const mwResponse = MiddlewareResponse.next()
    const invokeOptions = {}

    // The memfs mocks don't seem to work for this file
    vi.mock(
      '/redwood-app/web/dist/server/ogImage/pages/HomePage/HomePage.png.mjs',
      () => ({
        data: () => 'mocked data function',
        output: () => 'Mocked component render',
      }),
    )

    await middleware.invoke(req, mwResponse, invokeOptions)

    expect(mwResponse.body).toMatchInlineSnapshot(
      `"<div id="document"><div id="app"><div style="width:1200px">Mocked component render</div><div style="position:absolute;top:0;left:0;border:1px dashed red;pointer-events:none;width:1200px;height:630px"><div style="position:absolute;left:0;right:0;bottom:-1.5rem;text-align:center;color:red;font-weight:normal">1200 x 630</div></div></div></div>"`,
    )
    expect(mwResponse.headers.get('Content-Type')).toBe('text/html')
  })
})
