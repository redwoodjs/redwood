import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export async function buildForStreamingServer({
  verbose = false,
}: {
  verbose?: boolean
}) {
  console.log('Starting streaming server build.... \n')
  const rwPaths = getPaths()

  if (!rwPaths.web.viteConfig) {
    throw new Error('Vite config not found')
  }

  await viteBuild({
    configFile: rwPaths.web.viteConfig,
    build: {
      outDir: rwPaths.web.distServer,
      ssr: true, // use boolean here, instead of string.
      // rollup inputs are defined in the vite plugin
    },
    legacy: {
      // @MARK @TODO: this gets picked up by the RSC build if its in the index.js...
      buildSsrCjsExternalHeuristics: true,
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
