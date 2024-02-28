import { build as viteBuild } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'
import { ensureProcessDirWeb } from '../utils'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
export async function rscBuildClient(clientEntryFiles: Record<string, string>) {
  console.log('Starting RSC client build.... \n')
  const rwPaths = getPaths()

  ensureProcessDirWeb()

  if (!rwPaths.web.entryClient) {
    throw new Error('Missing web/src/entry.client')
  }

  const clientBuildOutput = await viteBuild({
    envFile: false,
    build: {
      outDir: rwPaths.web.distClient,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      rollupOptions: {
        onwarn: onWarn,
        input: {
          // @MARK: temporary hack to find the entry client so we can get the
          // index.css bundle but we don't actually want this on an rsc page!
          'rwjs-client-entry': rwPaths.web.entryClient,
          // we need this, so that the output contains rsc-specific bundles
          // for the client-only components. They get loaded, once the page is rendered
          ...clientEntryFiles,
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
        },
      },
      manifest: 'client-build-manifest.json',
    },
    esbuild: {
      logLevel: 'debug',
    },
  })

  if (process.cwd() !== rwPaths.web.base) {
    throw new Error(
      'Looks like you are running the command from the wrong dir, this can lead to unintended consequences on CSS processing'
    )
  }

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  return clientBuildOutput.output
}
