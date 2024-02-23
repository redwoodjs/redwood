import { getPaths } from '@redwoodjs/project-config'

import { buildForRscServer } from './rsc/buildForRscServer'
import { rscBuildAnalyze } from './rsc/rscBuildAnalyze'
import { rscBuildClient } from './rsc/rscBuildClient'
import { rscBuildClientEntriesMappings } from './rsc/rscBuildClientEntriesFile'
import { rscBuildCopyCssAssets } from './rsc/rscBuildCopyCssAssets'
import { rscBuildRwEnvVars } from './rsc/rscBuildRwEnvVars'

export const buildRscClientAndServer = async () => {
  const rwPaths = getPaths()
  // Analyze all files and generate a list of RSCs and RSFs
  const { clientEntryFiles, serverEntryFiles } = await rscBuildAnalyze()

  // Generate the client bundle
  const clientBuildOutput = await rscBuildClient(clientEntryFiles)

  // Generate the server output
  const serverBuildOutput = await buildForRscServer(
    clientEntryFiles,
    serverEntryFiles,
    {}
  )

  // Copy CSS assets from server to client
  // TODO(RSC_DC): Unsure why we're having to do this still.
  // Need to understand the thinking behind this, and how CSS assets get injected
  await rscBuildCopyCssAssets(
    serverBuildOutput,
    rwPaths.web.distClient,
    rwPaths.web.distRsc
  )

  // Mappings from server to client asset file names
  // Used by the RSC worker
  await rscBuildClientEntriesMappings(
    clientBuildOutput,
    serverBuildOutput,
    clientEntryFiles,
    rwPaths.web.distRscEntries
  )

  // Make RW specific env vars, like RWJS_ENV, available to server components
  await rscBuildRwEnvVars(rwPaths.web.distRscEntries)
}
