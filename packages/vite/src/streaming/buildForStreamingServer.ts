import react from '@vitejs/plugin-react'
import type { PluginOption } from 'vite'
import { build as viteBuild } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

import { RedwoodRoutesAutoLoaderRscServerPlugin } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { rscTransformEntryPlugin } from '../plugins/vite-plugin-rsc-transform-entry'

export async function buildForStreamingServer({
  verbose = false,
  rscEnabled = false,
}: {
  verbose?: boolean
  rscEnabled?: boolean
}) {
  console.log('Starting streaming server build...\n')
  const rwPaths = getPaths()

  if (!rwPaths.web.viteConfig) {
    throw new Error('Vite config not found')
  }

  const plugins: PluginOption[] = [
    cjsInterop({
      dependencies: ['@redwoodjs/**'],
    }),
  ]

  // Add additional plugins when this is for an RSC build
  if (rscEnabled) {
    plugins.push(rscTransformEntryPlugin())
    plugins.push(
      react({
        babel: {
          only: [/Routes.(js|tsx|jsx)$/],
          plugins: [[RedwoodRoutesAutoLoaderRscServerPlugin, {}]],
          babelrc: false,
          ignore: ['node_modules'],
        },
      }),
    )
  }

  await viteBuild({
    configFile: rwPaths.web.viteConfig,
    plugins,
    build: {
      // TODO (RSC): Remove `minify: false` when we don't need to debug as often
      minify: false,
      outDir: rwPaths.web.distServer,
      ssr: true,
      emptyOutDir: true,
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
