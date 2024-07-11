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
        dependencies: [
          // Skip ESM modules: rwjs/auth, rwjs/web
          '@redwoodjs/forms',
          '@redwoodjs/prerender/*',
          '@redwoodjs/router',
          // Middleware packages are dual packages already
          '@redwoodjs/auth-*-web',
          '@redwoodjs/auth-*-api',
        ],
      }),
    ],
    build: {
      // TODO (RSC): Remove `minify: false` when we don't need to debug as often
      minify: false,
      outDir: rwPaths.web.distSsr,
      ssr: true,
      emptyOutDir: true,
    },
    envFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    logLevel: verbose ? 'info' : 'warn',
  })
}
