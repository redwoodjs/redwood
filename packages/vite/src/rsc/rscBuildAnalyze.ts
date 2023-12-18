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
export async function rscBuildAnalyze(viteConfigPath: string) {
  const rwPaths = getPaths()
  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()

  if (!rwPaths.web.entries) {
    throw new Error('RSC entries file not found')
  }

  await viteBuild({
    configFile: viteConfigPath,
    root: rwPaths.base,
    plugins: [
      react(),
      // {
      //   name: 'rsc-test-plugin',
      //   transform(_code, id) {
      //     console.log('rsc-test-plugin id', id)
      //   },
      // },
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
