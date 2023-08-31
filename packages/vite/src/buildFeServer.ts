import fs from 'fs/promises'
import path from 'path'

import { build as esbuildBuild, PluginBuild } from 'esbuild'
import type { Manifest as ViteBuildManifest } from 'vite'

import {
  getRouteHookBabelPlugins,
  transformWithBabel,
} from '@redwoodjs/babel-config'
import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { findRouteHooksSrc } from '@redwoodjs/internal/dist/files'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getConfig, getPaths } from '@redwoodjs/project-config'

import { buildRscFeServer } from './buildRscFeServer'
import { RWRouteManifest } from './types'
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

    return await buildRscFeServer({
      viteConfigPath,
      webSrc: rwPaths.web.src,
      webHtml: rwPaths.web.html,
      entries: rwPaths.web.entries,
      webDist: rwPaths.web.dist,
      webDistServer: rwPaths.web.distServer,
      webDistEntries: rwPaths.web.distServerEntries,
      webRouteManifest: rwPaths.web.routeManifest,
    })
  }

  // Step 1A: Generate the client bundle
  await buildWeb({ verbose })

  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // so we can switch to a regular import
  // @NOTE: Using dynamic import, because vite is still opt-in
  const { build: viteBuild } = await import('vite')

  // Step 1B: Generate the server output
  await viteBuild({
    configFile: viteConfigPath,
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

  // Step 3: Generate route-manifest.json

  // TODO When https://github.com/tc39/proposal-import-attributes and
  // https://github.com/microsoft/TypeScript/issues/53656 have both landed we
  // should try to do this instead:
  // const clientBuildManifest: ViteBuildManifest = await import(
  //   path.join(getPaths().web.dist, 'build-manifest.json'),
  //   { with: { type: 'json' } }
  // )
  // NOTES:
  //  * There's a related babel plugin here
  //    https://babeljs.io/docs/babel-plugin-syntax-import-attributes
  //     * Included in `preset-env` if you set `shippedProposals: true`
  //  * We had this before, but with `assert` instead of `with`. We really
  //    should be using `with`. See motivation in issues linked above.
  //  * With `assert` and `@babel/plugin-syntax-import-assertions` the
  //    code compiled and ran properly, but Jest tests failed, complaining
  //    about the syntax.
  const manifestPath = path.join(getPaths().web.dist, 'build-manifest.json')
  const buildManifestStr = await fs.readFile(manifestPath, 'utf-8')
  const clientBuildManifest: ViteBuildManifest = JSON.parse(buildManifestStr)

  const routesList = getProjectRoutes()

  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.pathDefinition] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath]?.file
        : null,
      matchRegexString: route.matchRegexString,
      // @NOTE this is the path definition, not the actual path
      // E.g. /blog/post/{id:Int}
      pathDefinition: route.pathDefinition,
      hasParams: route.hasParams,
      routeHooks: FIXME_constructRouteHookPath(route.routeHooks),
      redirect: route.redirect
        ? {
            to: route.redirect?.to,
            permanent: false,
          }
        : null,
      renderMode: route.renderMode,
    }
    return acc
  }, {})

  await fs.writeFile(rwPaths.web.routeManifest, JSON.stringify(routeManifest))
}

// TODO (STREAMING) Hacky work around because when you don't have a App.routeHook, esbuild doesn't create
// the pages folder in the dist/server/routeHooks directory.
// @MARK need to change to .mjs here if we use esm
const FIXME_constructRouteHookPath = (rhSrcPath: string | null | undefined) => {
  const rwPaths = getPaths()
  if (!rhSrcPath) {
    return null
  }

  if (getAppRouteHook()) {
    return path.relative(rwPaths.web.src, rhSrcPath).replace('.ts', '.js')
  } else {
    return path
      .relative(path.join(rwPaths.web.src, 'pages'), rhSrcPath)
      .replace('.ts', '.js')
  }
}
