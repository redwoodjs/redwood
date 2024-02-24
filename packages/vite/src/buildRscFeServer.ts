import { rscBuildAnalyze } from './rsc/rscBuildAnalyze.js'
import { rscBuildClient } from './rsc/rscBuildClient.js'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile.js'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets.js'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars.js'
import { rscBuildServer } from './rsc/rscBuildServer.js'

interface Args {
  viteConfigPath: string
  webHtml: string
  entries: string
  webDist: string
  webDistServer: string
  webDistServerEntries: string
}

export const buildRscFeServer = async ({
  viteConfigPath,
  webHtml,
  entries,
  webDist,
  webDistServer,
  webDistServerEntries,
}: Args) => {
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles } = await rscBuildAnalyze(
    viteConfigPath
  )

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(
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

  // Make RW specific env vars, like RWJS_ENV, available to server components
  await rscBuildRwEnvVars(webDistServerEntries)
}
