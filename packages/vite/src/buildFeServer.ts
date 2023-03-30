import fs from 'fs/promises'
import path from 'path'

import { build as esbuildBuild, PluginBuild } from 'esbuild'
import type { Manifest as ViteBuildManifest } from 'vite'

import { prebuildApiFile } from '@redwoodjs/internal/dist/build/babel/api'
import { getWebSideBabelPlugins } from '@redwoodjs/internal/dist/build/babel/web'
import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { findRouteHooksSrc } from '@redwoodjs/internal/dist/files'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getPaths } from '@redwoodjs/project-config'

import { RWRouteManifest } from './types'

interface BuildOptions {
  verbose?: boolean
}

export const buildFeServer = async ({ verbose }: BuildOptions) => {
  const rwPaths = getPaths()
  const viteConfig = rwPaths.web.viteConfig

  if (!viteConfig) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`'
    )
  }

  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has an entry-client.{jsx,tsx} and entry-server.{jsx,tsx} file in the web/src directory.'
    )
  }

  // Step 1A: Generate the client bundle
  await buildWeb({ verbose })

  // @NOTE: Using dynamic import, because vite is still opt-in
  const { build } = await import('vite')

  // Step 1B: Generate the server output
  await build({
    configFile: viteConfig,
    build: {
      // Because we configure the root to be web/src, we need to go up one level
      outDir: rwPaths.web.distServer,
      ssr: rwPaths.web.entryServer,
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
        // @TODO: We need the new transformWithBabel function in https://github.com/redwoodjs/redwood/pull/7672/files
        const transformedCode = prebuildApiFile(
          args.path,
          args.path,
          getWebSideBabelPlugins()
        )

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
    // @MARK Disable splitting and esm, because Redwood web modules dont support esm yet
    // outExtension: { '.js': '.mjs' },
    // format: 'esm',
    // splitting: true,
    bundle: true,
    plugins: [runRwBabelTransformsPlugin],
    packages: 'external',
    logLevel: verbose ? 'info' : 'error',
    outdir: rwPaths.web.distRouteHooks,
  })

  // Step 3: Generate route-manifest.json
  const clientBuildManifest: ViteBuildManifest = await import(
    path.join(getPaths().web.dist, 'build-manifest.json')
  )

  const routesList = getProjectRoutes()

  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.path] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath].file
        : null,
      matchRegexString: route.matchRegexString,
      // @NOTE this is the path definition, not the actual path
      pathDefinition: route.path,
      routeHooks: route.routeHooks
        ? // @MARK need to change to .mjs here if we use esm
          path.relative(rwPaths.web.src, route.routeHooks).replace('.ts', '.js')
        : null,
      redirect: route.redirect
        ? {
            to: route.redirect?.to,
            permanent: false,
          }
        : null,
    }
    return acc
  }, {})

  await fs.writeFile(rwPaths.web.routeManifest, JSON.stringify(routeManifest))
}
