import { build as viteBuild } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn.js'
import { rscRoutesAutoLoader } from '../plugins/vite-plugin-rsc-routes-auto-loader.js'

/**
 * RSC build. Step #?
 * SSR build for when RSC is enabled
 */
export async function rscBuildForSsr({
  clientEntryFiles,
  verbose = false,
}: {
  clientEntryFiles: Record<string, string>
  verbose?: boolean
}) {
  console.log('\n')
  console.log('#?. rscBuildForSsr')
  console.log('==================\n')

  const rwPaths = getPaths()

  if (!rwPaths.web.entryClient) {
    throw new Error('No client entry file found inside ' + rwPaths.web.src)
  }

  if (!rwPaths.web.entryServer) {
    throw new Error('No server entry file found inside ' + rwPaths.web.src)
  }

  await viteBuild({
    envFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [
      cjsInterop({ dependencies: ['@redwoodjs/**'] }),
      rscRoutesAutoLoader(),
    ],
    build: {
      // TODO (RSC): Remove `minify: false` when we don't need to debug as often
      minify: false,
      outDir: rwPaths.web.distServer,
      // ssr: true,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      rollupOptions: {
        onwarn: onWarn,
        input: {
          // @MARK: temporary hack to find the entry client so we can get the
          // index.css bundle but we don't actually want this on an rsc page!
          // TODO (RSC): Look into if we can remove this (and perhaps instead
          // use __rwjs__ServerEntry)
          'rwjs-client-entry': rwPaths.web.entryClient,
          __rwjs__ServerEntry: rwPaths.web.entryServer,
          // we need this, so that the output contains rsc-specific bundles
          // for the client-only components. They get loaded once the page is
          // rendered
          ...clientEntryFiles,
          __rwjs__react: 'react',
          __rwjs__location: '@redwoodjs/router/dist/location',
          // TODO (RSC): add __rwjs__ prefix to the two entries below
          'rd-server': 'react-dom/server.edge',
          'rsdw-client': 'react-server-dom-webpack/client.edge',
        },
        preserveEntrySignatures: 'exports-only',
        output: {
          // This is not ideal. See
          // https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
          // But we need it to prevent `import 'client-only'` from being
          // hoisted into App.tsx
          // TODO (RSC): Fix when https://github.com/rollup/rollup/issues/5235
          // is resolved
          hoistTransitiveImports: false,
          entryFileNames: (chunkInfo) => {
            if (
              chunkInfo.name === 'rd-server' ||
              chunkInfo.name === 'rsdw-client' ||
              chunkInfo.name === '__rwjs__location' ||
              chunkInfo.name === '__rwjs__react' ||
              chunkInfo.name === '__rwjs__ServerEntry'
            ) {
              return '[name].mjs'
            }
            return 'assets/[name]-[hash].mjs'
          },
          chunkFileNames: `assets/[name]-[hash].mjs`,
        },
      },
      manifest: 'client-build-manifest-ssr.json',
    },
    esbuild: {
      logLevel: verbose ? 'debug' : 'silent',
    },
    logLevel: verbose ? 'info' : 'silent',
  })
}
