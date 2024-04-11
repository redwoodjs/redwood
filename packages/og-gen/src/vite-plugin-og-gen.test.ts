import { vol, fs as memfs } from 'memfs'
import { describe, expect, test, vi, beforeAll, afterAll } from 'vitest'

import vitePluginOgGen from './vite-plugin-og-gen'

// Memfs mocks the redwood project-config stuff
vi.mock('fs', () => ({ ...memfs, default: { ...memfs } }))
vi.mock('node:fs', () => ({ ...memfs, default: { ...memfs } }))

vi.mock('fast-glob', () => {
  return {
    default: {
      sync: vi
        .fn()
        .mockReturnValue([
          '/redwood-app/web/src/pages/Posts/PostsPage/PostsPage.png.tsx',
          '/redwood-app/web/src/pages/About/AboutPage.jpg.jsx',
          '/redwood-app/web/src/pages/Contact/ContactPage.png.jsx',
        ]),
    },
  }
})

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

    // Call the config function returned by the plugin
    const updatedConfig = plugin.config()

    // Assert the rollup inputs
    expect(updatedConfig.build?.rollupOptions?.input).toEqual({
      'ogGen/pages/Posts/PostsPage/PostsPage.png':
        '/redwood-app/web/src/pages/Posts/PostsPage/PostsPage.png.tsx',
      'ogGen/pages/About/AboutPage.jpg':
        '/redwood-app/web/src/pages/About/AboutPage.jpg.jsx',
      'ogGen/pages/Contact/ContactPage.png':
        '/redwood-app/web/src/pages/Contact/ContactPage.png.jsx',
    })
  })

  test('returns the correct Vite plugin object', async () => {
    const expectedPlugin = {
      name: 'rw-vite-plugin-og-gen',
      apply: 'build', // Important!
      config: expect.any(Function),
    }

    const plugin = await vitePluginOgGen()

    expect(plugin).toEqual(expectedPlugin)
  })
})
