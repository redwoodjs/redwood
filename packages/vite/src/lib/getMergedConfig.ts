import path from 'node:path'

import type { InputOption } from 'rollup'
import type { ConfigEnv, UserConfig } from 'vite'
import { mergeConfig } from 'vite'

import type { Config, Paths } from '@redwoodjs/project-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { getEnvVarDefinitions } from './envVarDefinitions'

/**
 * This function will merge in the default Redwood Vite config passed into the
 * build function (or in Vite.config.xxx)
 *
 * Note that returning plugins in this function will have no effect on the
 * build
 */
export function getMergedConfig(rwConfig: Config, rwPaths: Paths) {
  return (userConfig: UserConfig, env: ConfigEnv): UserConfig => {
    let apiHost = process.env.REDWOOD_API_HOST
    apiHost ??= rwConfig.api.host
    apiHost ??= process.env.NODE_ENV === 'production' ? '0.0.0.0' : '[::]'

    const streamingSsrEnabled = rwConfig.experimental.streamingSsr?.enabled
    // @MARK: note that most RSC settings sit in their individual build functions
    const rscEnabled = rwConfig.experimental.rsc?.enabled

    let apiPort
    if (process.env.REDWOOD_API_PORT) {
      apiPort = parseInt(process.env.REDWOOD_API_PORT)
    } else {
      apiPort = rwConfig.api.port
    }

    const defaultRwViteConfig: UserConfig = {
      root: rwPaths.web.src,
      // @MARK: when we have these aliases, the warnings from the FE server go
      // away BUT, if you have imports like this:
      // ```
      // import RandomNumberServerCell from
      //   'src/components/RandomNumberServerCell/RandomNumberServerCell'
      // ```
      // they start failing (can't have the double
      // `/RandomNumberServerCell/RandomNumberServerCell` at the end)
      //
      // resolve: {
      //   alias: [
      //     {
      //       find: 'src',
      //       replacement: rwPaths.web.src,
      //     },
      //   ],
      // },
      envPrefix: 'REDWOOD_ENV_',
      publicDir: path.join(rwPaths.web.base, 'public'),
      define: getEnvVarDefinitions(),
      css: {
        // @NOTE config path is relative to where vite.config.js is if you use
        // a relative path
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
              // @MARK: this is a hack to prevent showing confusing proxy
              // errors on startup because Vite launches so much faster than
              // the API server.
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
                        'The RedwoodJS API server is not available or is ' +
                        'currently reloading. Please refresh.',
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
        // NOTE this gets overridden when build gets called anyway!
        outDir:
          // @MARK: For RSC and Streaming, we build to dist/client directory
          streamingSsrEnabled || rscEnabled
            ? rwPaths.web.distClient
            : rwPaths.web.dist,
        emptyOutDir: true,
        manifest: !env.ssrBuild ? 'client-build-manifest.json' : undefined,
        // Note that sourcemap can be boolean or 'inline'
        sourcemap: !env.ssrBuild && rwConfig.web.sourceMap,
        rollupOptions: {
          input: getRollupInput(!!env.ssrBuild),
        },
      },
      // @MARK: do not set buildSsrCjsExternalHeuristics here
      // because rsc builds want false, client and server build wants true
      optimizeDeps: {
        esbuildOptions: {
          // @MARK this is because JS projects in Redwood don't have .jsx
          // extensions
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

    return mergeConfig(defaultRwViteConfig, userConfig)
  }
}

/**
 * This function configures how vite (actually Rollup) will bundle.
 *
 * By default, the entry point is the index.html file - even if you don't
 * specify it in RollupOptions
 *
 * With streaming SSR, out entrypoint is different - either entry.client.tsx or
 * entry.server.tsx and the html file is not used at all, because it is defined
 * in Document.tsx
 *
 * @param ssr {boolean} Whether to return the SSR inputs or not
 * @returns Rollup input Options
 */
function getRollupInput(ssr: boolean): InputOption | undefined {
  const rwConfig = getConfig()
  const rwPaths = getPaths()

  // @NOTE once streaming ssr is out of experimental, this will become the
  // default
  if (rwConfig.experimental.streamingSsr.enabled) {
    return ssr
      ? {
          'entry.server': rwPaths.web.entryServer as string,
          // We need the document for React's fallback
          Document: rwPaths.web.document,
        }
      : (rwPaths.web.entryClient as string)
  }

  return rwPaths.web.html
}
