import path from 'node:path'

import type { InputOption } from 'rollup'
import type { ConfigEnv, UserConfig } from 'vite'

import type { Config, Paths } from '@redwoodjs/project-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { getEnvVarDefinitions } from './envVarDefinitions'

export function getDefaultViteConfig(rwConfig: Config, rwPaths: Paths) {
  return (options: UserConfig, env: ConfigEnv): UserConfig => {
    let apiHost = process.env.REDWOOD_API_HOST
    apiHost ??= rwConfig.api.host
    apiHost ??= process.env.NODE_ENV === 'production' ? '0.0.0.0' : '[::]'

    let apiPort
    if (process.env.REDWOOD_API_PORT) {
      apiPort = parseInt(process.env.REDWOOD_API_PORT)
    } else {
      apiPort = rwConfig.api.port
    }

    return {
      root: rwPaths.web.src,
      // Disabling for now, let babel handle this for consistency
      // resolve: {
      //   alias: [
      //     {
      //       find: 'src',
      //       replacement: redwoodPaths.web.src,
      //     },
      //   ],
      // },
      envPrefix: 'REDWOOD_ENV_',
      publicDir: path.join(rwPaths.web.base, 'public'),
      define: getEnvVarDefinitions(),
      css: {
        // @NOTE config path is relative to where vite.config.js is if you use relative path
        // postcss: './config/',
        postcss: rwPaths.web.config,
      },
      server: {
        open: rwConfig.browser.open,
        port: rwConfig.web.port,
        host: true, // Listen to all hosts
        proxy: {
          [rwConfig.web.apiUrl]: {
            target: `http://${apiHost}:${apiPort}`,
            changeOrigin: false,
            // Remove the `.redwood/functions` part, but leave the `/graphql`
            rewrite: (path) => path.replace(rwConfig.web.apiUrl, ''),
            configure: (proxy) => {
              // @MARK: this is a hack to prevent showing confusing proxy errors on startup
              // because Vite launches so much faster than the API server.
              let waitingForApiServer = true

              // Wait for 2.5s, then restore regular proxy error logging
              setTimeout(() => {
                waitingForApiServer = false
              }, 2500)

              proxy.on('error', (err, _req, res) => {
                if (
                  waitingForApiServer &&
                  err.message.includes('ECONNREFUSED')
                ) {
                  err.stack =
                    '⌛ API Server launching, please refresh your page...'
                }
                const msg = {
                  errors: [
                    {
                      message:
                        'The RedwoodJS API server is not available or is currently reloading. Please refresh.',
                    },
                  ],
                }

                res.writeHead(203, {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                })
                res.write(JSON.stringify(msg))
                res.end()
              })
            },
          },
        },
      },
      build: {
        outDir: options.build?.outDir || rwPaths.web.dist,
        emptyOutDir: true,
        manifest: !env.ssrBuild ? 'client-build-manifest.json' : undefined,
        sourcemap: !env.ssrBuild && rwConfig.web.sourceMap, // Note that this can be boolean or 'inline'
        rollupOptions: {
          input: getRollupInput(!!env.ssrBuild),
        },
      },
      legacy: {
        buildSsrCjsExternalHeuristics: rwConfig.experimental?.rsc?.enabled
          ? false
          : env.ssrBuild,
      },
      optimizeDeps: {
        esbuildOptions: {
          // @MARK this is because JS projects in Redwood don't have .jsx extensions
          loader: {
            '.js': 'jsx',
          },
          // Node.js global to browser globalThis
          // @MARK unsure why we need this, but required for DevFatalErrorPage
          // at least
          define: {
            global: 'globalThis',
          },
        },
      },
    }
  }
}

/**
 * This function configures how vite (actually Rollup) will bundle.
 *
 * By default, the entry point is the index.html file - even if you don't specify it in RollupOptions
 *
 * With streaming SSR, out entrypoint is different - either entry.client.tsx or entry.server.tsx
 * and the html file is not used at all, because it is defined in Document.tsx
 *
 * @param ssr {boolean} Whether to return the SSR inputs or not
 * @returns Rollup input Options
 */
function getRollupInput(ssr: boolean): InputOption | undefined {
  const rwConfig = getConfig()
  const rwPaths = getPaths()

  // @NOTE once streaming ssr is out of experimental, this will become the default
  if (rwConfig.experimental.streamingSsr.enabled) {
    return ssr
      ? {
          'entry.server': rwPaths.web.entryServer as string,
          Document: rwPaths.web.document, // We need the document for React's fallback
        }
      : (rwPaths.web.entryClient as string)
  }

  return rwPaths.web.html
}
