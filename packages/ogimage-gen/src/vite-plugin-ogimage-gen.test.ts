import { vol, fs as memfs } from 'memfs'
import { describe, expect, test, vi, beforeAll, afterAll } from 'vitest'

import { ensurePosixPath } from '@redwoodjs/project-config'

import vitePluginOgGen from './vite-plugin-ogimage-gen'

// Memfs mocks the redwood project-config stuff
vi.mock('fs', () => ({ ...memfs, default: { ...memfs } }))
vi.mock('node:fs', () => ({ ...memfs, default: { ...memfs } }))

/**
 *   +   "ogImage/pages\\About\\AboutPage.jpg": "/redwood-app/web/src/pages/About/AboutPage.jpg.jsx",
  +   "ogImage/pages\\Contact\\ContactPage.png": "/redwood-app/web/src/pages/Contact/ContactPage.png.jsx",
  +   "ogGen\\pages\\Posts\\PostsPage\\PostsPage.png": "/redwood-app/web/src/pages/Posts/PostsPage/PostsPage.png.tsx",
 */

describe('vitePluginOgGen', () => {
  let original_RWJS_CWD

  beforeAll(() => {
    original_RWJS_CWD = process.env.RWJS_CWD
    process.env.RWJS_CWD = '/redwood-app'
    // Mock the file system using memfs
    vol.fromJSON(
      {
        'redwood.toml': '',
        'web/src/pages/Posts/PostsPage/PostsPage.png.tsx': 'PostsOG',
        'web/src/pages/About/AboutPage.jpg.jsx': 'AboutOG',
        'web/src/pages/Contact/ContactPage.png.jsx': 'ContactOG',
      },
      '/redwood-app',
    )
  })

  afterAll(() => {
    process.env.RWJS_CWD = original_RWJS_CWD
  })

  test('should generate rollup inputs for all OG components', async () => {
    // Type cast so TS doesn't complain calling config below
    // because config can be of many types!
    const plugin = (await vitePluginOgGen()) as {
      config: (...args: any) => any
    }

    const rollupInputs = plugin.config().build?.rollupOptions?.input

    const inputKeys = Object.keys(rollupInputs)

    expect(inputKeys).toEqual(
      expect.arrayContaining([
        'ogImage/pages/Posts/PostsPage/PostsPage.png',
        'ogImage/pages/About/AboutPage.jpg',
        'ogImage/pages/Contact/ContactPage.png',
      ]),
    )

    // For windows, we do the conversion before the test
    expect(
      ensurePosixPath(
        rollupInputs['ogImage/pages/Posts/PostsPage/PostsPage.png'],
      ),
    ).toMatch('/redwood-app/web/src/pages/Posts/PostsPage/PostsPage.png.tsx')

    expect(
      ensurePosixPath(rollupInputs['ogImage/pages/About/AboutPage.jpg']),
    ).toMatch('/redwood-app/web/src/pages/About/AboutPage.jpg.jsx')

    expect(
      ensurePosixPath(rollupInputs['ogImage/pages/Contact/ContactPage.png']),
    ).toMatch('/redwood-app/web/src/pages/Contact/ContactPage.png.jsx')
  })

  test('returns the correct Vite plugin object', async () => {
    const expectedPlugin = {
      name: 'rw-vite-plugin-ogimage-gen',
      apply: 'build', // Important!
      config: expect.any(Function),
    }

    const plugin = await vitePluginOgGen()

    expect(plugin).toEqual(expectedPlugin)
  })
})
