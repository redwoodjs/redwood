import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

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
    build: {
      outDir: rwPaths.web.distServer,
      ssr: true,
      emptyOutDir: true,
    },
    plugins: [
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
          }),
        },
      }),
    ],
    legacy: {
      // @MARK @TODO: this gets picked up by the RSC build if it's in index.js
      buildSsrCjsExternalHeuristics: true,
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
