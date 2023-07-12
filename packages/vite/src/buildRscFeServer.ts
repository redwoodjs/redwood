import fs from 'fs/promises'
import path from 'path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'
import type { Manifest as ViteBuildManifest } from 'vite'

import { RouteSpec } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'

import { RWRouteManifest } from './types'
import { serverBuild } from './waku-lib/build-server'
import { rscAnalyzePlugin, rscIndexPlugin } from './waku-lib/vite-plugin-rsc'

interface BuildOptions {
  verbose?: boolean
}

export const buildFeServer = async ({ verbose: _verbose }: BuildOptions) => {
  const rwPaths = getPaths()
  const viteConfig = rwPaths.web.viteConfig

  if (!viteConfig) {
    throw new Error('Vite config not found')
  }

  if (!rwPaths.web.entries) {
    throw new Error('RSC entries file not found')
  }

  const clientEntryFileSet = new Set<string>()
  const serverEntryFileSet = new Set<string>()

  /**
   * RSC build
   * Uses rscAnalyzePlugin to collect client and server entry points
   * Starts building the AST in entries.ts
   * Doesn't output any files, only collects a list of RSCs and RSFs
   */
  await viteBuild({
    configFile: viteConfig,
    root: rwPaths.base,
    plugins: [
      react(),
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
      manifest: 'rsc-build-manifest.json',
      write: false,
      ssr: true,
      rollupOptions: {
        input: {
          entries: rwPaths.web.entries,
        },
      },
    },
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
    configFile: viteConfig,
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
      manifest: 'client-build-manifest.json',
    },
    esbuild: {
      logLevel: 'debug',
    },
  })

  if (!('output' in clientBuildOutput)) {
    throw new Error('Unexpected vite client build output')
  }

  const serverBuildOutput = await serverBuild(
    rwPaths.web.entries,
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // TODO (RSC) Some css is now duplicated in two files (i.e. for client
  // components). Probably don't want that.
  // Also not sure if this works on "soft" rerenders (i.e. not a full page
  // load)
  await Promise.all(
    serverBuildOutput.output
      .filter((item) => {
        return item.type === 'asset' && item.fileName.endsWith('.css')
      })
      .map((cssAsset) => {
        return fs.copyFile(
          path.join(rwPaths.web.distServer, cssAsset.fileName),
          path.join(rwPaths.web.dist, cssAsset.fileName)
        )
      })
  )

  const clientEntries: Record<string, string> = {}
  for (const item of clientBuildOutput.output) {
    const { name, fileName } = item
    const entryFile =
      name &&
      // TODO (RSC) Can't we just compare the names? `item.name === name`
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
  const manifestPath = path.join(
    getPaths().web.dist,
    'client-build-manifest.json'
  )
  const manifestStr = await fs.readFile(manifestPath, 'utf-8')
  const clientBuildManifest: ViteBuildManifest = JSON.parse(manifestStr)

  // TODO (RSC) We don't have support for a router yet, so skip all routes
  const routesList = [] as RouteSpec[] // getProjectRoutes()

  // This is all a no-op for now
  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.path] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath].file
        : null,
      matchRegexString: route.matchRegexString,
      // NOTE this is the path definition, not the actual path
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
