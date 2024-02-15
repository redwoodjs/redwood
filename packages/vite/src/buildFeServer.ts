import { build as viteBuild } from 'vite'

import { buildWeb } from '@redwoodjs/internal/dist/build/web'
import type { Paths } from '@redwoodjs/project-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { buildRouteHooks } from './buildRouteHooks'
import { buildRouteManifest } from './buildRouteManifest'
import { buildRscClientAndWorker } from './buildRscFeServer'
import { ensureProcessDirWeb } from './utils'

export interface BuildOptions {
  verbose?: boolean
  webDir?: string
}

// const SKIP = true

export const buildFeServer = async ({ verbose, webDir }: BuildOptions = {}) => {
  ensureProcessDirWeb(webDir)

  const rwPaths = getPaths()
  const rwConfig = getConfig()
  const viteConfigPath = rwPaths.web.viteConfig

  const rscBuild = rwConfig.experimental?.rsc?.enabled
  const streamingBuild = rwConfig.experimental?.streamingSsr?.enabled

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

  if (rscBuild) {
    if (!rwPaths.web.entries) {
      throw new Error('RSC entries file not found')
    }

    await buildRscClientAndWorker({
      viteConfigPath,
      webHtml: rwPaths.web.html,
      entries: rwPaths.web.entries,
      webDist: rwPaths.web.dist,
      webDistServer: rwPaths.web.distServer,
      webDistServerEntries: rwPaths.web.dist + '/rsc/entries.js',
    })
  }

  // We generate the RSC client bundle in the buildRscFeServer function
  // Streaming and RSC client bundles are **not** the same
  if (streamingBuild && !rscBuild) {
    await buildWeb({ verbose })
  }

  // Generates the output used for the server (streaming/ssr but NOT rsc)
  await buildForServer(viteConfigPath, rwPaths, verbose)

  await buildRouteHooks(verbose, rwPaths)

  // Write a route manifest
  await buildRouteManifest()
}

async function buildForServer(
  viteConfigPath: string,
  rwPaths: Paths,
  verbose: boolean | undefined
) {
  await viteBuild({
    configFile: viteConfigPath,
    build: {
      outDir: rwPaths.web.distServer,
      ssr: true, // use boolean here, instead of string.
      // rollup inputs are defined in the vite plugin
    },
    legacy: {
      buildSsrCjsExternalHeuristics: true, // @MARK @TODO: this gets picked up by the RSC build if its in the index.js.....
    },
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
