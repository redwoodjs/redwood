import { readFile } from 'fs/promises'

import { transformWithEsbuild, PluginOption } from 'vite'

/**
 *
 * This is a vite plugin to load and transform JS files as JSX.
 *
 */
export function handleJsAsJsx(): PluginOption {
  return {
    name: 'load+transform-js-files-as-jsx',
    // @MARK we do both load and transform here, because:
    // without load: React is not found
    // without transform: SVG imports do not work
    async load(id: string) {
      if (!id.match(/src\/.*\.js$/)) {
        return null
      }

      const code = await readFile(id, 'utf8')

      // Use the exposed transform from vite, instead of directly
      // transforming with esbuild
      return transformWithEsbuild(code, id, {
        loader: 'jsx',
      })
    },
    async transform(code: string, id: string) {
      if (!id.match(/src\/.*\.js$/)) {
        return null
      }

      // Use the exposed transform from vite, instead of directly
      // transforming with esbuild
      return transformWithEsbuild(code, id, {
        loader: 'jsx',
      })
    },
  }
}
