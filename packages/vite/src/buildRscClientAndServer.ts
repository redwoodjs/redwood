import { rscBuildAnalyze } from './rsc/rscBuildAnalyze.js'
import { rscBuildClient } from './rsc/rscBuildClient.js'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile.js'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets.js'
import { rscBuildForServer } from './rsc/rscBuildForServer.js'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars.js'

export const buildRscClientAndServer = async () => {
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles, componentImportMap } =
    await rscBuildAnalyze()

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(clientEntryFiles)

  console.log({
    clientEntryFiles,
    serverEntryFiles,
  })

  // Generate the server output
  const serverBuildOutput = await rscBuildForServer(
    clientEntryFiles,
    serverEntryFiles,
    {},
    componentImportMap,
  )

  // Copy CSS assets from server to client
  //
  // TODO (RSC): We need to better understand how this work and how it can be
  // improved.
  // Can we do this more similar to how it's done for streaming?
  await rscBuildCopyCssAssets(serverBuildOutput)

  // Mappings from server to client asset file names
  // Used by the RSC worker
  await rscBuildClientEntriesMappings(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles,
  )

  // Make RW specific env vars, like RWJS_ENV, available to server components
  await rscBuildRwEnvVars()
}
