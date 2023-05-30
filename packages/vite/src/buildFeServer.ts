import fs from 'fs/promises'
import path from 'path'

import react from '@vitejs/plugin-react'
import { build as esbuildBuild, PluginBuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import type { Manifest as ViteBuildManifest } from 'vite'

import { getRouteHookBabelPlugins } from '@redwoodjs/internal'
import { transformWithBabel } from '@redwoodjs/internal/dist/build/babel/api'
import { getRouteHookBabelPlugins } from '@redwoodjs/internal/dist/build/babel/common'
// import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { findRouteHooksSrc } from '@redwoodjs/internal/dist/files'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'

import { RWRouteManifest } from './types'
import { serverBuild } from './waku-lib/build-server'
// import { configFileConfig } from './waku-lib/config'
// import { rscAnalyzePlugin, rscIndexPlugin } from './waku-lib/vite-plugin-rsc'
import { rscAnalyzePlugin, rscIndexPlugin } from './waku-lib/vite-plugin-rsc'

interface BuildOptions {
  verbose?: boolean
}

export const buildFeServer = async ({ verbose }: BuildOptions) => {
  const rwPaths = getPaths()
  // const viteConfig = rwPaths.web.viteConfig

  // if (!viteConfig) {
  //   throw new Error(
  //     'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`'
  //   )
  // }

  // if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
  //   throw new Error(
  //     'Vite entry points not found. Please check that your project has an ' +
  //       'entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in the ' +
  //       'web/src directory.'
  //   )
  // }

  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // so we can switch to a regular import
  // @NOTE: Using dynamic import, because vite is still opt-in
  // const { build } = await import('vite')
  // const { build, resolveConfig } = await import('vite')

  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()

  /**
   * RSC build
   * Uses rscAnalyzePlugin to collect client and server entry points
   * Starts building the AST in entries.ts
   * Doesn't output any files, only collects a list of RSCs and RSFs
   */
  await viteBuild({
    // ...configFileConfig,
    root: rwPaths.base,
    plugins: [
      // react(), // Not needed with "jsx: 'react-jsx'" in the app's tsconfig.json
      {
        name: 'rsc-test-plugin',
        transform(_code, id) {
          console.log('rsc-test-plugin id', id)
        },
      },
      rscAnalyzePlugin(
        (id) => clientEntryFileSet.add(id),
        (id) => serverEntryFileSet.add(id)
      ),
    ],
    // ssr: {
    //   // FIXME Without this, waku/router isn't considered to have client
    //   // entries, and "No client entry" error occurs.
    //   // Unless we fix this, RSC-capable packages aren't supported.
    //   // This also seems to cause problems with pnpm.
    //   // noExternal: ['@redwoodjs/web', '@redwoodjs/router'],
    // },
    build: {
      write: false,
      ssr: true,
      rollupOptions: {
        input: {
          // entries: rwPaths.web.entryServer,
          entries: path.join(rwPaths.web.src, 'entries.ts'),
        },
      },
    },
    // legacy: {
    //   buildSsrCjsExternalHeuristics: true,
    // },
    // optimizeDeps: {
    //   esbuildOptions: {
    //     // @MARK this is because JS projects in Redwood don't have .jsx extensions
    //     loader: {
    //       '.js': 'jsx',
    //     },
    //     // Node.js global to browser globalThis
    //     // @MARK unsure why we need this, but required for DevFatalErrorPage at least
    //     define: {
    //       global: 'globalThis',
    //     },
    //   },
    // },
  })

  const clientEntryFiles = Object.fromEntries(
    Array.from(clientEntryFileSet).map((filename, i) => [`rsc${i}`, filename])
  )
  const serverEntryFiles = Object.fromEntries(
    Array.from(serverEntryFileSet).map((filename, i) => [`rsf${i}`, filename])
  )

  console.log('clientEntryFileSet', Array.from(clientEntryFileSet))
  console.log('serverEntryFileSet', Array.from(serverEntryFileSet))
  console.log('clientEntryFiles', clientEntryFiles)
  console.log('serverEntryFiles', serverEntryFiles)

  const clientEntryPath = rwPaths.web.entryClient

  if (!clientEntryPath) {
    throw new Error(
      'Vite client entry point not found. Please check that your project ' +
        'has an entry.client.{jsx,tsx} file in the web/src directory.'
    )
  }

  const clientBuildOutput = await viteBuild({
    // ...configFileConfig,
    root: rwPaths.web.src,
    plugins: [
      // TODO (RSC) Update index.html to include the entry.client.js script
      // TODO (RSC) Do the above in the exp-rsc setup command
      // {
      //   name: 'redwood-plugin-vite',

      //   // ---------- Bundle injection ----------
      //   // Used by rollup during build to inject the entrypoint
      //   // but note index.html does not come through as an id during dev
      //   transform: (code: string, id: string) => {
      //     if (
      //       existsSync(clientEntryPath) &&
      //       // TODO (RSC) Is this even needed? We throw if we can't find it above
      //       // TODO (RSC) Consider making this async (if we do need it)
      //       normalizePath(id) === normalizePath(rwPaths.web.html)
      //     ) {
      //       const newCode = code.replace(
      //         '</head>',
      //         '<script type="module" src="entry.client.jsx"></script></head>'
      //       )
      //
      //       return { code: newCode, map: null }
      //     } else {
      //       // Returning null as the map preserves the original sourcemap
      //       return { code, map: null }
      //     }
      //   },
      // },
      react(),
      rscIndexPlugin(),
    ],
    build: {
      outDir: rwPaths.web.dist,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      // TODO (RSC) Enable this when we switch to a server-first approach
      // emptyOutDir: false, // Already done when building server
      rollupOptions: {
        input: {
          main: rwPaths.web.html,
          ...clientEntryFiles,
        },
        preserveEntrySignatures: 'exports-only',
      },
      manifest: 'build-manifest.json',
    },
    esbuild: {
      logLevel: 'debug',
    },
  })

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  const serverBuildOutput = await serverBuild(
    // rwPaths.web.entryServer,
    path.join(rwPaths.web.src, 'entries.ts'),
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  const clientEntries: Record<string, string> = {}
  for (const item of clientBuildOutput.output) {
    const { name, fileName } = item
    const entryFile =
      name &&
      serverBuildOutput.output.find(
        (item) =>
          'moduleIds' in item &&
          item.moduleIds.includes(clientEntryFiles[name] as string)
      )?.fileName
    if (entryFile) {
      clientEntries[entryFile] = fileName
    }
  }

  console.log('clientEntries', clientEntries)

  await fs.appendFile(
    path.join(rwPaths.web.distServer, 'entries.js'),
    `export const clientEntries=${JSON.stringify(clientEntries)};`
  )

  console.log('serverBuildOutput', serverBuildOutput)

  if (Math.random() > 5) {
    // throw new Error('stop')
  }

  // // Step 1A: Generate the client bundle
  // await buildWeb({ verbose })

  // const rollupInput = {
  //   entries: rwPaths.web.entryServer,
  //   ...clientEntryFiles,
  //   ...serverEntryFiles,
  // }

  // Step 1B: Generate the server output
  // await build({
  //   // TODO (RSC) I had this marked as 'FIXME'. I guess I just need to make
  //   // sure we still include it, or at least make it possible for users to pass
  //   // in their own config
  //   // configFile: viteConfig,
  //   ssr: {
  //     noExternal: Array.from(clientEntryFileSet).map(
  //       // TODO (RSC) I think the comment below is from waku. We don't care
  //       // about pnpm, do we? Does it also affect yarn?
  //       // FIXME this might not work with pnpm
  //       // TODO (RSC) No idea what's going on here
  //       (filename) => {
  //         const nodeModulesPath = path.join(rwPaths.base, 'node_modules')
  //         console.log('nodeModulesPath', nodeModulesPath)
  //         const relativePath = path.relative(nodeModulesPath, filename)
  //         console.log('relativePath', relativePath)
  //         console.log('first split', relativePath.split('/')[0])

  //         return relativePath.split('/')[0]
  //       }
  //     ),
  //   },
  //   build: {
  //     // Because we configure the root to be web/src, we need to go up one level
  //     outDir: rwPaths.web.distServer,
  //     // TODO (RSC) Maybe we should re-enable this. I can't remember anymore)
  //     // What does 'ssr' even mean?
  //     // ssr: rwPaths.web.entryServer,
  //     rollupOptions: {
  //       input: {
  //         // TODO (RSC) entries: rwPaths.web.entryServer,
  //         ...clientEntryFiles,
  //         ...serverEntryFiles,
  //       },
  //       output: {
  //         banner: (chunk) => {
  //           console.log('chunk', chunk)

  //           // HACK to bring directives to the front
  //           let code = ''

  //           if (chunk.moduleIds.some((id) => clientEntryFileSet.has(id))) {
  //             code += '"use client";'
  //           }

  //           if (chunk.moduleIds.some((id) => serverEntryFileSet.has(id))) {
  //             code += '"use server";'
  //           }

  //           console.log('code', code)
  //           return code
  //         },
  //         entryFileNames: (chunkInfo) => {
  //           console.log('chunkInfo', chunkInfo)

  //           // TODO (RSC) Don't hardcode 'entry.server'
  //           if (chunkInfo.name === 'entry.server') {
  //             return '[name].js'
  //           }

  //           return 'assets/[name].js'
  //         },
  //       },
  //     },
  //   },
  //   envFile: false,
  //   logLevel: verbose ? 'info' : 'warn',
  // })

  // Skip route hooks support for now
  if (Math.random() > 5) {
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
  }

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
    acc[route.path] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath].file
        : null,
      matchRegexString: route.matchRegexString,
      // @NOTE this is the path definition, not the actual path
      // E.g. /blog/post/{id:Int}
      pathDefinition: route.path,
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

if (require.main === module) {
  const verbose = process.argv.includes('--verbose')
  buildFeServer({ verbose })
}
