import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildForServer } from './rsc/rscBuildForServer'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars'

export const buildRscFeServer = async () => {
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles } = await rscBuildAnalyze()

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(clientEntryFiles)

  // Generate the server output
  const serverBuildOutput = await rscBuildForServer(
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // Copy CSS assets from server to client
  await rscBuildCopyCssAssets(serverBuildOutput)

  // Mappings from server to client asset file names
  await rscBuildClientEntriesMappings(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles
  )

  // Make RW specific env vars, like RWJS_ENV, available to server components
  await rscBuildRwEnvVars()
}
