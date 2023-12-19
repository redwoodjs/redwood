import type { PluginBuild } from 'esbuild'
import { build as esbuildBuild } from 'esbuild'
import { build as viteBuild } from 'vite'

import {
  getRouteHookBabelPlugins,
  transformWithBabel,
} from '@redwoodjs/babel-config'
import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { findRouteHooksSrc } from '@redwoodjs/internal/dist/files'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { buildRouteManifest } from './buildRouteManifest'
import { buildRscFeServer } from './buildRscFeServer'
import { ensureProcessDirWeb } from './utils'

export interface BuildOptions {
  verbose?: boolean
  webDir?: string
}

export const buildFeServer = async ({ verbose, webDir }: BuildOptions = {}) => {
  ensureProcessDirWeb(webDir)

  const rwPaths = getPaths()
  const rwConfig = getConfig()
  const viteConfigPath = rwPaths.web.viteConfig

  if (!viteConfigPath) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite ' +
        'using `yarn rw setup vite`'
    )
  }

  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has an ' +
        'entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in the ' +
        'web/src directory.'
    )
  }

  if (rwConfig.experimental?.rsc?.enabled) {
    if (!rwPaths.web.entries) {
      throw new Error('RSC entries file not found')
    }

    await buildRscFeServer({
      viteConfigPath,
      webHtml: rwPaths.web.html,
      entries: rwPaths.web.entries,
      webDist: rwPaths.web.dist,
      webDistServer: rwPaths.web.distServer,
      webDistServerEntries: rwPaths.web.distServerEntries,
    })

    // Write a route manifest
    return await buildRouteManifest()
  }

  // Step 1A: Generate the client bundle
  await buildWeb({ verbose })

  // Step 1B: Generate the server output
  await viteBuild({
    configFile: viteConfigPath,
    build: {
      outDir: rwPaths.web.distServer,
      ssr: true, // use boolean here, instead of string.
      // rollup inputs are defined in the vite plugin
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })

  const allRouteHooks = findRouteHooksSrc()

  const runRwBabelTransformsPlugin = {
    name: 'rw-esbuild-babel-transform',
    setup(build: PluginBuild) {
      build.onLoad({ filter: /\.(js|ts|tsx|jsx)$/ }, async (args) => {
        // Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
        // TODO (STREAMING) We need the new transformWithBabel function in https://github.com/redwoodjs/redwood/pull/7672/files
        const transformedCode = transformWithBabel(args.path, [
          ...getRouteHookBabelPlugins(),
        ])

        if (transformedCode?.code) {
          return {
            contents: transformedCode.code,
            loader: 'js',
          }
        }

        throw new Error(`Could not transform file: ${args.path}`)
      })
    },
  }

  await esbuildBuild({
    absWorkingDir: getPaths().web.base,
    entryPoints: allRouteHooks,
    platform: 'node',
    target: 'node16',
    // @MARK Disable splitting and esm, because Redwood web modules don't support esm yet
    // outExtension: { '.js': '.mjs' },
    // format: 'esm',
    // splitting: true,
    bundle: true,
    plugins: [runRwBabelTransformsPlugin],
    packages: 'external',
    logLevel: verbose ? 'info' : 'error',
    outdir: rwPaths.web.distRouteHooks,
  })

  // Write a route manifest
  await buildRouteManifest()
}
