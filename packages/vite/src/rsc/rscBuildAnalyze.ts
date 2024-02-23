import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'

import { rscAnalyzePlugin } from './rscVitePlugins'

/**
 * RSC build. Step 1.
 * buildFeServer -> buildRscFeServer -> rscBuildAnalyze
 * Uses rscAnalyzePlugin to collect client and server entry points
 * Starts building the AST in entries.ts
 * Doesn't output any files, only collects a list of RSCs and RSFs
 */
// @TODO(RSC_DC): Can we skip actually building here?
// only needed to trigger the rscAnalyzePlugin

export async function rscBuildAnalyze() {
  const rwPaths = getPaths()
  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()

  if (!rwPaths.web.entries) {
    throw new Error('RSC entries file not found')
  }

  if (!rwPaths.web.viteConfig) {
    throw new Error('Vite config not found')
  }

  await viteBuild({
    configFile: rwPaths.web.viteConfig,
    root: rwPaths.base,
    plugins: [
      react(),
      rscAnalyzePlugin(
        (id) => clientEntryFileSet.add(id),
        (id) => serverEntryFileSet.add(id)
      ),
    ],
    ssr: {
      // We can ignore everything that starts with `node:` because it's not going to be RSCs
      noExternal: /^(?!node:)/,
      // TODO (RSC): Figure out what the `external` list should be. Right
      // now it's just copied from waku
      external: ['react', 'minimatch'],
      resolve: {
        externalConditions: ['react-server'],
      },
    },
    build: {
      manifest: 'rsc-build-manifest.json',
      write: false,
      ssr: true,
      rollupOptions: {
        onwarn: onWarn,
        input: {
          // @TODO(RSC_DC): We could generate this entries file from the analyzedRoutes
          entries: rwPaths.web.entries,
        },
      },
    },
    legacy: {
      buildSsrCjsExternalHeuristics: true,
    },
  })

  const clientEntryFiles = Object.fromEntries(
    Array.from(clientEntryFileSet).map((filename, i) => [`rsc${i}`, filename])
  )
  const serverEntryFiles = Object.fromEntries(
    Array.from(serverEntryFileSet).map((filename, i) => [`rsf${i}`, filename])
  )

  console.log('clientEntryFileSet', Array.from(clientEntryFileSet))
  console.log('serverEntryFileSet', Array.from(serverEntryFileSet))
  console.log('clientEntryFiles', clientEntryFiles)
  console.log('serverEntryFiles', serverEntryFiles)

  return { clientEntryFiles, serverEntryFiles }
}
