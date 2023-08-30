import fs from 'fs/promises'
import path from 'path'

import react from '@vitejs/plugin-react'
import { build as viteBuild } from 'vite'
import type { Manifest as ViteBuildManifest } from 'vite'

import { RouteSpec } from '@redwoodjs/internal/dist/routes'

import { rscBuild } from './rscBuild'
import { RWRouteManifest } from './types'
import { serverBuild } from './waku-lib/build-server'
import { rscIndexPlugin } from './waku-lib/vite-plugin-rsc'

interface Args {
  viteConfigPath: string
  webSrc: string
  webHtml: string
  entries: string
  webDist: string
  webDistServer: string
  webDistEntries: string
  webRouteManifest: string
}

export const buildRscFeServer = async ({
  viteConfigPath,
  webSrc,
  webHtml,
  entries,
  webDist,
  webDistServer,
  webDistEntries,
  webRouteManifest,
}: Args) => {
  const { clientEntryFiles, serverEntryFiles } = await rscBuild(viteConfigPath)

  const clientBuildOutput = await viteBuild({
    // configFile: viteConfigPath,
    root: webSrc,
    plugins: [react(), rscIndexPlugin()],
    resolve: {
      conditions: ['react-server'],
    },
    build: {
      outDir: webDist,
      emptyOutDir: true, // Needed because `outDir` is not inside `root`
      // TODO (RSC) Enable this when we switch to a server-first approach
      // emptyOutDir: false, // Already done when building server
      rollupOptions: {
        input: {
          main: webHtml,
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
    entries,
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
          path.join(webDistServer, cssAsset.fileName),
          path.join(webDist, cssAsset.fileName)
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
    webDistEntries,
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
  //   path.join(getPaths().web.dist, 'client-build-manifest.json'),
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
  const manifestPath = path.join(webDist, 'client-build-manifest.json')
  const manifestStr = await fs.readFile(manifestPath, 'utf-8')
  const clientBuildManifest: ViteBuildManifest = JSON.parse(manifestStr)

  // TODO (RSC) We don't have support for a router yet, so skip all routes
  const routesList = [] as RouteSpec[] // getProjectRoutes()

  // This is all a no-op for now
  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.pathDefinition] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath].file
        : null,
      matchRegexString: route.matchRegexString,
      // NOTE this is the path definition, not the actual path
      // E.g. /blog/post/{id:Int}
      pathDefinition: route.pathDefinition,
      hasParams: route.hasParams,
      routeHooks: null,
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

  await fs.writeFile(webRouteManifest, JSON.stringify(routeManifest))
}
