import path from 'node:path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'

import { getConfig, getPaths } from '@redwoodjs/project-config'

import { onWarn } from '../lib/onWarn'

import { rscIndexPlugin } from './rscVitePlugins'

/**
 * RSC build. Step 2.
 * buildFeServer -> buildRscFeServer -> rscBuildClient
 * Generate the client bundle
 */
export async function rscBuildClient(
  webHtml: string,
  webDist: string,
  clientEntryFiles: Record<string, string>
) {
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  const graphQlUrl =
    rwConfig.web.apiGraphQLUrl ?? rwConfig.web.apiUrl + '/graphql'

  const clientBuildOutput = await viteBuild({
    // configFile: viteConfigPath,
    root: rwPaths.web.src,
    envPrefix: 'REDWOOD_ENV_',
    publicDir: path.join(rwPaths.web.base, 'public'),
    define: {
      RWJS_ENV: {
        __REDWOOD__APP_TITLE: rwConfig.web.title || path.basename(rwPaths.base),
        RWJS_API_GRAPHQL_URL: graphQlUrl,
        RWJS_API_URL: rwConfig.web.apiUrl,
        RWJS_EXP_STREAMING_SSR: rwConfig.experimental?.streamingSsr?.enabled,
        RWJS_EXP_RSC: rwConfig.experimental?.rsc?.enabled,
      },
      RWJS_DEBUG_ENV: {
        RWJS_SRC_ROOT: rwPaths.web.src,
        REDWOOD_ENV_EDITOR: JSON.stringify(process.env.REDWOOD_ENV_EDITOR),
      },
      // Vite can automatically expose environment variables, but we
      // disable that in `buildFeServer.ts` by setting `envFile: false`
      // because we want to use our own logic for loading .env,
      // .env.defaults, etc
      // The two object spreads below will expose all environment
      // variables listed in redwood.toml and all environment variables
      // prefixed with REDWOOD_ENV_
      ...Object.fromEntries(
        rwConfig.web.includeEnvironmentVariables.flatMap((envName) => [
          // TODO (RSC): Figure out if/why we need to disable eslint here.
          // Re-enable if possible
          // eslint-disable-next-line
          [`import.meta.env.${envName}`, JSON.stringify(process.env[envName])],
          // TODO (RSC): Figure out if/why we need to disable eslint here
          // Re-enable if possible
          // eslint-disable-next-line
          [`process.env.${envName}`, JSON.stringify(process.env[envName])],
        ])
      ),
      ...Object.entries(process.env).reduce<Record<string, any>>(
        (acc, [key, value]) => {
          if (key.startsWith('REDWOOD_ENV_')) {
            acc[`import.meta.env.${key}`] = JSON.stringify(value)
            acc[`process.env.${key}`] = JSON.stringify(value)
          }

          return acc
        },
        {}
      ),
    },
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
