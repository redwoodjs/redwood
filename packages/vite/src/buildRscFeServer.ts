import fs from 'fs/promises'
import path from 'path'

import type { Manifest as ViteBuildManifest } from 'vite'

import type { RouteSpec } from '@redwoodjs/internal/dist/routes'

import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesFile } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildServer } from './rsc/rscBuildServer'
import type { RWRouteManifest } from './types'

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
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles } = await rscBuildAnalyze(
    viteConfigPath
  )

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(
    webSrc,
    webHtml,
    webDist,
    clientEntryFiles
  )

  // Generate the server output
  const serverBuildOutput = await rscBuildServer(
    entries,
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // Copy CSS assets from server to client
  await rscBuildCopyCssAssets(serverBuildOutput, webDist, webDistServer)

  await rscBuildClientEntriesFile(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles,
    webDistEntries
  )

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
