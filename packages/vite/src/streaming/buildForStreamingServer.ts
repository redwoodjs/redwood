import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

import { RedwoodRoutesAutoLoaderRscServerPlugin } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { rscTransformEntryPlugin } from '../plugins/vite-plugin-rsc-transform-entry'

export async function buildForStreamingServer({
  verbose = false,
}: {
  verbose?: boolean
}) {
  console.log('Starting streaming server build...\n')
  const rwPaths = getPaths()

  if (!rwPaths.web.viteConfig) {
    throw new Error('Vite config not found')
  }

  await viteBuild({
    configFile: rwPaths.web.viteConfig,
    plugins: [
      cjsInterop({
        dependencies: ['@redwoodjs/**'],
      }),
      rscTransformEntryPlugin(),
      react({
        babel: {
          only: [/Routes.(js|tsx|jsx)$/],
          plugins: [[RedwoodRoutesAutoLoaderRscServerPlugin, {}]],
          babelrc: false,
          ignore: ['node_modules'],
        },
      }),
    ],
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
