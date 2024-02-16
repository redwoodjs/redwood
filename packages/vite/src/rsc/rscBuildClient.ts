import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

import { getViteDefines } from '../lib/getViteDefines'
import { onWarn } from '../lib/onWarn'

import { rscIndexPlugin } from './rscVitePlugins'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
// @TODO(RSC_DC): no redwood-vite plugin
// @MARK: I can't seem to remove the duplicated defines here - while it builds
// the output doesn't run anymore (RWJS_ENV undefined etc.)
// why? It's definitely using the vite plugin, but the defines don't come through?
export async function rscBuildClient(
  webHtml: string,
  webDist: string,
  clientEntryFiles: Record<string, string>
) {
  console.log('Starting RSC client build.... \n')
  const rwPaths = getPaths()

  if (process.cwd() !== rwPaths.web.base) {
    throw new Error(
      'Looks like you are running the command from the wrong dir, this can lead to unintended consequences on CSS processing'
    )
  }

  const clientBuildOutput = await viteBuild({
    // @MARK  This runs on TOP of the settings in rw-vite-plugin, because we don't set configFile: false
    root: rwPaths.web.src,
    envPrefix: 'REDWOOD_ENV_',
    publicDir: path.join(rwPaths.web.base, 'public'),
    envFile: false,
    // @MARK: We need to duplicate the defines here.
    define: getViteDefines(),
    plugins: [
      // @MARK We need to duplicate the plugins here.... otherwise builds fail I don't understand why
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
            // @MARK 👇 This flag is different for RSC Client builds
            forRscClient: true,
          }),
        },
      }),

      // @TODO(RSC_DC): this plugin modifies index.html but in streaming there's not index.html!!
      rscIndexPlugin(),
    ],
    build: {
      outDir: webDist + '/client',
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
