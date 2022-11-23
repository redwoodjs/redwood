import path from 'path'

import react from '@vitejs/plugin-react'
import { UserConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

import { getWebSideDefaultBabelConfig } from '@redwoodjs/internal/dist/build/babel/web'
import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths } from '@redwoodjs/internal/dist/paths'

const redwoodConfig = getConfig()
const redwoodPaths = getPaths()

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
      createHtmlPlugin({
        template: './index.html',
        inject: {
          data: {
            prerenderPlaceholder: '<server-markup></server-markup>', // remove the placeholder
          },
          ejsOptions: {
            escape: (str) => str, // skip escaping
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
  }
}
