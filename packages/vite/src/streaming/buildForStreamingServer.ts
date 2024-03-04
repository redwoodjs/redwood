import { build as viteBuild } from 'vite'

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
    legacy: {
      // @MARK The Streaming SSR build produces CJS output. RSC is ESM
      // TODO: Remove this config once we can build ESM output for streaming
      // too
      buildSsrCjsExternalHeuristics: true,
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
