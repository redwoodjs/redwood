import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { onWarn } from '../lib/onWarn'
import { rscIndexPlugin } from '../waku-lib/vite-plugin-rsc'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
export async function rscBuildClient(
  webSrc: string,
  webHtml: string,
  webDist: string,
  clientEntryFiles: Record<string, string>
) {
  const clientBuildOutput = await viteBuild({
    // configFile: viteConfigPath,
    root: webSrc,
    plugins: [react(), rscIndexPlugin()],
    build: {
      outDir: webDist,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      // TODO (RSC) Enable this when we switch to a server-first approach
      // emptyOutDir: false, // Already done when building server
      rollupOptions: {
        onwarn: onWarn,
        input: {
          main: webHtml,
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

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  return clientBuildOutput.output
}
