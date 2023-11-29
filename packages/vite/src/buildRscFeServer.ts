import fs from 'fs/promises'
import path from 'path'

import type { Manifest as ViteBuildManifest } from 'vite'

import type { RouteSpec } from '@redwoodjs/internal/dist/routes'
import { getPaths } from '@redwoodjs/project-config'

import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
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
  webDistServerEntries: string
  webRouteManifest: string
}

export const buildRscFeServer = async ({
  viteConfigPath,
  webSrc,
  webHtml,
  entries,
  webDist,
  webDistServer,
  webDistServerEntries,
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

  // Mappings from server to client asset file names
  await rscBuildClientEntriesMappings(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles,
    webDistServerEntries
  )

  const clientBuildManifest: ViteBuildManifest = await import(
    path.join(getPaths().web.dist, 'client-build-manifest.json'),
    { with: { type: 'json' } }
  )

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
