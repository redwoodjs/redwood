import { readFile as fsReadFile, existsSync } from 'fs'
import path from 'path'
import { promisify } from 'util'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { transform } from 'esbuild'
import { normalizePath, UserConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/internal/dist/build/babel/web'
import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths } from '@redwoodjs/internal/dist/paths'

const readFile = promisify(fsReadFile)

/**
 * Preconfigured vite plugin, with required config for Redwood apps.
 *
 * @returns {VitePlugin}
 */
export default function redwoodPluginVite() {
  const redwoodPaths = getPaths()
  const redwoodConfig = getConfig()

  const clientEntryPath = path.join(redwoodPaths.web.src, 'entry-client.jsx')

  return [
    {
      name: 'redwood-plugin-vite',
      // Used by Vite during dev, to inject the entrypoint.
      transformIndexHtml: (html: string) => {
        if (existsSync(clientEntryPath)) {
          return html.replace(
            '</head>',
            `<script type="module" src="${clientEntryPath}"></script>
        </head>`
          )
        } else {
          return html
        }
      },
      // Used by rollup during build to inject the entrypoint
      // but note index.html does not come through as an id during dev
      transform: (code: string, id: string) => {
        if (
          existsSync(clientEntryPath) &&
          normalizePath(id) === normalizePath(redwoodPaths.web.html)
        ) {
          return code.replace(
            '</head>',
            `<script type="module" src="entry-client.jsx"></script>
        </head>`
          )
        } else {
          return code
        }
      },
      config: (): UserConfig => {
        return {
          root: redwoodPaths.web.src,
          resolve: {
            alias: [
              {
                find: 'src',
                replacement: redwoodPaths.web.src,
              },
            ],
          },
          envPrefix: 'REDWOOD_ENV_',
          publicDir: path.join(redwoodPaths.web.base, 'public'),
          define: {
            RWJS_WEB_BUNDLER: JSON.stringify('vite'),
            RWJS_ENV: {
              // @NOTE we're avoiding process.env here, unlike webpack
              RWJS_API_GRAPHQL_URL:
                redwoodConfig.web.apiGraphQLUrl ??
                redwoodConfig.web.apiUrl + '/graphql',
              RWJS_API_URL: redwoodConfig.web.apiUrl,
              __REDWOOD__APP_TITLE:
                redwoodConfig.web.title || path.basename(redwoodPaths.base),
            },
            RWJS_DEBUG_ENV: {
              RWJS_SRC_ROOT: redwoodPaths.web.src,
            },
          },
          css: {
            // @NOTE config path is relative to where vite.config.js is if you use relative path
            // postcss: './config/',
            postcss: redwoodPaths.web.config,
          },
          server: {
            // @MARK intentionally commenting this out, on my machine it pops up with "where is undefined"
            // under the hood it's using https://github.com/sindresorhus/open#app which needs an app specified
            // open: redwoodConfig.browser.open,
            port: redwoodConfig.web.port,
            proxy: {
              //@TODO we need to do a check for absolute urls here
              [redwoodConfig.web.apiUrl]: {
                target: `http://localhost:${redwoodConfig.api.port}`,
                changeOrigin: true,
                // @MARK might be better to use a regex maybe
                rewrite: (path) => path.replace(redwoodConfig.web.apiUrl, ''),
              },
            },
          },
          build: {
            outDir: redwoodPaths.web.dist,
            emptyOutDir: true,
            manifest: 'build-manifest.json',
          },
          optimizeDeps: {
            esbuildOptions: {
              // @MARK this is because JS projects in Redwood don't have .jsx extensions
              loader: {
                '.js': 'jsx',
              },
              // Node.js global to browser globalThis
              // @MARK unsure why we need this,
              // but as soon as we added the buffer polyfill, this seems to be required
              define: {
                global: 'globalThis',
              },

              // Enable esbuild polyfill plugins
              // This is needed for DevFatalErrorPage (and stacktracey)
              plugins: [
                // @ts-expect-error type error in plugin
                NodeGlobalsPolyfillPlugin({
                  buffer: true,
                }),
              ],
            },
          },
        }
      },
    },
    {
      // @MARK Adding this custom plugin to support jsx files with .js extensions
      // This is the default in Redwood JS projects. We can remove this once Vite is stable,
      // and have a codemod to convert all JSX files to .jsx extensions
      name: 'load-js-files-as-jsx',
      async load(id: string) {
        if (!id.match(/src\/.*\.js$/)) {
          return
        }

        const file = await readFile(id, 'utf-8')
        return transform(file, { loader: 'jsx' })
      },
    },
    react({
      babel: {
        ...getWebSideDefaultBabelConfig({
          forVite: true,
        }),
      },
    }),
    createHtmlPlugin({
      template: './index.html',
      inject: {
        data: {
          prerenderPlaceholder: '<server-markup></server-markup>', // remove the placeholder
        },
        ejsOptions: {
          escape: (str: string) => str, // skip escaping
        },
      },
    }),
    // @MARK We add this as a temporary workaround for DevFatalErrorPage being required
    // Note that it only transforms commonjs in dev, which is exactly what we want!
    // Maybe we could have a custom plugin to only transform the DevFatalErrorPage?
    viteCommonjs(),
  ]
}
