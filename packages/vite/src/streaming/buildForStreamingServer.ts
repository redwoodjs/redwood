import { build as viteBuild } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

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
    plugins: [
      cjsInterop({
        dependencies: ['@redwoodjs/**'],
      }),
    ],
    build: {
      outDir: rwPaths.web.distServer,
      ssr: true,
      emptyOutDir: true,
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
