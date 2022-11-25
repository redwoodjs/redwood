import { readFile as fsReadFile } from 'fs'
import path from 'path'
import { promisify } from 'util'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import react from '@vitejs/plugin-react'
import { transform } from 'esbuild'
import { UserConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/internal/dist/build/babel/web'
import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths } from '@redwoodjs/internal/dist/paths'

const redwoodConfig = getConfig()
const redwoodPaths = getPaths()

const readFile = promisify(fsReadFile)

/**
 * Preconfigured vite config for RedwoodJS
 * You can extend, override, or use this config directly
 *
 * @returns {UserConfig}
 */
export default function redwoodVite(): UserConfig {
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
    plugins: [
      react({
        babel: {
          ...getWebSideDefaultBabelConfig({
            forVite: true,
          }),
        },
      }),
      {
        name: 'load-js-files-as-jsx',
        async load(id) {
          if (!id.match(/src\/.*\.js$/)) {
            return
          }

          const file = await readFile(id, 'utf-8')
          return transform(file, { loader: 'jsx' })
        },
      },
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
    ],
    define: {
      RWJS_WEB_BUNDLER: JSON.stringify('vite'),
      RWJS_ENV: {
        // @MARK instead of using process.env, we directly assign these variables
        RWJS_API_GRAPHQL_URL:
          redwoodConfig.web.apiGraphQLUrl ??
          redwoodConfig.web.apiUrl + '/graphql',
        RWJS_API_DBAUTH_URL:
          redwoodConfig.web.apiDbAuthUrl ?? `${redwoodConfig.web.apiUrl}/auth`,
        RWJS_API_URL: redwoodConfig.web.apiUrl,
        // @TODO add fallback to folder name
        __REDWOOD__APP_TITLE:
          redwoodConfig.web.title || path.basename(redwoodPaths.base),
      },
      RWJS_DEBUG_ENV: {
        RWJS_SRC_ROOT: redwoodPaths.web.src,
      },
    },
    css: {
      // @MARK config path is relative to where vite.config.js is if you use relative path
      // postcss: './config/',
      postcss: redwoodPaths.web.config,
    },
    server: {
      proxy: {
        //@MARK we need to do a check for absolute urls here
        [getConfig().web.apiUrl]: {
          target: 'http://localhost:8911',
          changeOrigin: true,
          // @MARK might be better to use a regex maybe
          rewrite: (path) => path.replace(getConfig().web.apiUrl, ''),
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
        // Node.js global to browser globalThis
        // @MARK unsure why we need this,
        // but as soon as we added the buffer polyfill, this seems to be required
        define: {
          global: 'globalThis',
        },

        // Enable esbuild polyfill plugins
        // This is needed for DevFatalErrorPage (and stacktracey)
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
          }),
        ],
      },
    },
  }
}
