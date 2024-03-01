import { build as viteBuild } from 'vite'

import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { buildRouteHooks } from './buildRouteHooks'
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

    await buildRscFeServer()

    // Write a route manifest
    return await buildRouteManifest()

    //
    // RSC specific code ends here
    //
  }

  //
  // SSR Specific code below
  //

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

  await buildRouteHooks(verbose, rwPaths)

  // Write a route manifest
  await buildRouteManifest()
}
