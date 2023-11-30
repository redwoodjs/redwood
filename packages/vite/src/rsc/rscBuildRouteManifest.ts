import fs from 'fs/promises'
import path from 'path'

import type { Manifest as ViteBuildManifest } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getPaths } from '@redwoodjs/project-config'

import type { RWRouteManifest } from '../types'

/**
 * RSC build. Step 6.
 * Generate a route manifest file for the web server side.
 */
export async function rscBuildRouteManifest(webRouteManifest: string) {
  const manifestPath = path.join(
    getPaths().web.dist,
    'client-build-manifest.json'
  )
  const buildManifestStr = await fs.readFile(manifestPath, 'utf-8')
  const clientBuildManifest: ViteBuildManifest = JSON.parse(buildManifestStr)

  const routesList = getProjectRoutes()

  const routeManifest = routesList.reduce<RWRouteManifest>((acc, route) => {
    acc[route.pathDefinition] = {
      name: route.name,
      bundle: route.relativeFilePath
        ? clientBuildManifest[route.relativeFilePath]?.file ?? null
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

  console.log('routeManifest', JSON.stringify(routeManifest, null, 2))

  return fs.writeFile(webRouteManifest, JSON.stringify(routeManifest, null, 2))
}
