import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildForWorker } from './rsc/rscBuildForWorker'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars'

interface Args {
  viteConfigPath: string
  webHtml: string
  entries: string
  webDist: string
  webDistServer: string
  webDistServerEntries: string
}

export const buildRscClientAndWorker = async ({
  viteConfigPath,
  webHtml,
  entries,
  webDist,
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
  const serverBuildOutput = await rscBuildForWorker(
    entries,
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // Copy CSS assets from server to client
  // TODO(RSC_DC): I think not required, the clientBuild just doesn't
  // have postcss configured)
  await rscBuildCopyCssAssets(
    serverBuildOutput,
    webDist + '/client',
    webDist + '/rsc'
  )

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
