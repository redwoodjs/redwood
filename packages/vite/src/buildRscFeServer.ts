import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildRouteManifest } from './rsc/rscBuildRouteManifest'
import { rscBuildServer } from './rsc/rscBuildServer'

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

  // Write a route manifest
  await rscBuildRouteManifest(webRouteManifest)
}
