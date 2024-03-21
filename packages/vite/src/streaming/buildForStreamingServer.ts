import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'
import { cjsInterop } from 'vite-plugin-cjs-interop'

import { RedwoodRoutesAutoLoaderRscServerPlugin } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

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

  // TODO (RSC): Remove this when SSR+RSC is the default
  if (!rwPaths.web.entryServer) {
    throw new Error('Server entry point not found')
  }

  await viteBuild({
    configFile: rwPaths.web.viteConfig,
    plugins: [
      cjsInterop({
        dependencies: ['@redwoodjs/**'],
      }),
      rscEnabled &&
        react({
          babel: {
            only: [/Routes.(js|tsx|jsx)$/],
            plugins: [[RedwoodRoutesAutoLoaderRscServerPlugin, {}]],
            babelrc: false,
            ignore: ['node_modules'],
          },
        }),
    ],
    ssr: {
      // noExternal: 'react-dom/server.edge',
      noExternal: /^(?!node:)/,
    },
    build: {
      // TODO (RSC): Remove `minify: false` when we don't need to debug as often
      minify: false,
      outDir: rwPaths.web.distServer,
      ssr: true,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          'rd-server': 'react-dom/server.edge',
          'entry.server': rwPaths.web.entryServer,
          // We need the document for React's fallback
          Document: rwPaths.web.document,
        },
        // output: {
        //   entryFileNames: (chunkInfo) => {
        //     if (chunkInfo.name === 'rd-server') {
        //       return 'rd-server.mjs'
        //     } else {
        //       return '[name].mjs'
        //     }
        //   },
        // },
      },
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
