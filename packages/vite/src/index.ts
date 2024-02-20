import fs from 'fs'
import path from 'path'

import react from '@vitejs/plugin-react'
import type { InputOption } from 'rollup'
import type { ConfigEnv, UserConfig, PluginOption } from 'vite'
import { normalizePath } from 'vite'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/babel-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { getViteDefines } from './lib/getViteDefines'
import handleJsAsJsx from './plugins/vite-plugin-jsx-loader'
import removeFromBundle from './plugins/vite-plugin-remove-from-bundle'
import swapApolloProvider from './plugins/vite-plugin-swap-apollo-provider'

/**
 * Pre-configured vite plugin, with required config for Redwood apps.
 */
export default function redwoodPluginVite(): PluginOption[] {
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  const clientEntryPath = rwPaths.web.entryClient

  if (!clientEntryPath) {
    throw new Error(
      'Vite client entry point not found. Please check that your project has an entry.client.{jsx,tsx} file in the web/src directory.'
    )
  }

  const relativeEntryPath = path.relative(rwPaths.web.src, clientEntryPath)

  // If realtime is enabled, we want to include the sseLink in the bundle.
  // Right now the only way we have of telling is if the package is installed on the api side.
  const realtimeEnabled = fs
    .readFileSync(path.join(rwPaths.api.base, 'package.json'), 'utf-8')
    .includes('@redwoodjs/realtime')

  return [
    {
      name: 'redwood-plugin-vite-html-env',

      // Vite can support replacing environment variables in index.html but
      // there are currently two issues with that:
      // 1. It requires the environment variables to be exposed on
      //    `import.meta.env`, but we expose them on `process.env` in Redwood.
      // 2. There's an open issue on Vite where it adds extra quotes around
      //    the replaced values, which breaks trying to use environment
      //    variables in src attributes for example.
      // Until those issues are resolved, we'll do the replacement ourselves
      // instead using transformIndexHtml. Doing it this was was also the
      // recommended way until Vite added built-in support for it.
      //
      // Extra quotes issue: https://github.com/vitejs/vite/issues/13424
      // transformIndexHtml being the recommended way:
      //   https://github.com/vitejs/vite/issues/3105#issuecomment-1059975023
      transformIndexHtml: {
        // Setting order: 'pre' so that it runs before the built-in
        // html env replacement.
        order: 'pre',
        handler: (html: string) => {
          let newHtml = html

          rwConfig.web.includeEnvironmentVariables.map((envName) => {
            newHtml = newHtml.replaceAll(
              `%${envName}%`,
              process.env[envName] || ''
            )
          })

          Object.entries(process.env).forEach(([envName, value]) => {
            if (envName.startsWith('REDWOOD_ENV_')) {
              newHtml = newHtml.replaceAll(`%${envName}%`, value || '')
            }
          })

          return newHtml
        },
      },
    },
    {
      name: 'redwood-plugin-vite',

      // ---------- Bundle injection ----------
      // Used by Vite during dev, to inject the entrypoint.
      transformIndexHtml: {
        order: 'pre',
        handler: (html: string) => {
          // So we inject the entrypoint with the correct extension .tsx vs .jsx

          // And then inject the entry
          if (fs.existsSync(clientEntryPath)) {
            return html.replace(
              '</head>',
              // @NOTE the slash in front, for windows compatibility and for pages in subdirectories
              `<script type="module" src="/${relativeEntryPath}"></script>
        </head>`
            )
          } else {
            return html
          }
        },
      },
      // Used by rollup during build to inject the entrypoint
      // but note index.html does not come through as an id during dev
      transform: (code: string, id: string) => {
        if (
          fs.existsSync(clientEntryPath) &&
          normalizePath(id) === normalizePath(rwPaths.web.html)
        ) {
          return {
            code: code.replace(
              '</head>',
              `<script type="module" src="/${relativeEntryPath}"></script>
        </head>`
            ),
            map: null,
          }
        } else {
          return {
            code,
            map: null, // Returning null here preserves the original sourcemap
          }
        }
      },
      // ---------- End Bundle injection ----------

      config: (options: UserConfig, env: ConfigEnv): UserConfig => {
        let apiHost = process.env.REDWOOD_API_HOST
        apiHost ??= rwConfig.api.host
        apiHost ??= process.env.NODE_ENV === 'production' ? '0.0.0.0' : '[::]'

        const streamingBuild = rwConfig.experimental.streamingSsr?.enabled
        // @MARK: note that most RSC settings sit in their individual build functions
        const rscBuild = rwConfig.experimental.rsc?.enabled

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
          define: getViteDefines(),
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
            outDir:
              options.build?.outDir ||
              // @MARK: For RSC and Streaming, we build to dist/client directory
              (streamingBuild || rscBuild
                ? rwPaths.web.distClient
                : rwPaths.web.dist),
            emptyOutDir: true,
            manifest: !env.ssrBuild ? 'client-build-manifest.json' : undefined,
            sourcemap: !env.ssrBuild && rwConfig.web.sourceMap, // Note that this can be boolean or 'inline'
            rollupOptions: {
              input: getRollupInput(!!env.ssrBuild),
            },
          },
          // @MARK: do not set buildSsrCjsExternalHeuristics here
          // because rsc builds want false, client and server build wants true
          optimizeDeps: {
            esbuildOptions: {
              // @MARK this is because JS projects in Redwood don't have .jsx extensions
              loader: {
                '.js': 'jsx',
              },
              // Node.js global to browser globalThis
              // @MARK unsure why we need this, but required for DevFatalErrorPage atleast
              define: {
                global: 'globalThis',
              },
            },
          },
        }
      },
    },
    // We can remove when streaming is stable
    rwConfig.experimental.streamingSsr.enabled && swapApolloProvider(),
    handleJsAsJsx(),
    // Remove the splash-page from the bundle.
    removeFromBundle([
      {
        id: /@redwoodjs\/router\/dist\/splash-page/,
      },
    ]),
    !realtimeEnabled &&
      removeFromBundle([
        {
          id: /@redwoodjs\/web\/dist\/apollo\/sseLink/,
        },
      ]),
    react({
      babel: {
        ...getWebSideDefaultBabelConfig({
          forVite: true,
        }),
      },
    }),
  ]
}

/**
 *
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
