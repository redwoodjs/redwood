import fs from 'fs/promises'
import path from 'path'

import type { Manifest as ViteBuildManifest } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'

import type { RWRouteManifest } from './types'

/**
 * RSC build. Step 6.
 * Generate a route manifest file for the web server side.
 */
export async function buildRouteManifest() {
  const webRouteManifest = getPaths().web.routeManifest

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

  console.log('routeManifest', JSON.stringify(routeManifest, null, 2))

  return fs.writeFile(webRouteManifest, JSON.stringify(routeManifest, null, 2))
}

// TODO (STREAMING) Hacky work around because when you don't have a App.routeHook, esbuild doesn't create
// the pages folder in the dist/server/routeHooks directory.
// @MARK need to change to .mjs here if we use esm
const FIXME_constructRouteHookPath = (
  routeHookSrcPath: string | null | undefined
) => {
  const rwPaths = getPaths()
  if (!routeHookSrcPath) {
    return null
  }

  if (getAppRouteHook()) {
    return path
      .relative(rwPaths.web.src, routeHookSrcPath)
      .replace('.ts', '.js')
  } else {
    return path
      .relative(path.join(rwPaths.web.src, 'pages'), routeHookSrcPath)
      .replace('.ts', '.js')
  }
}
