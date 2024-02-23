import fs from 'fs/promises'
import path from 'path'

import type { buildForRscServer } from './buildForRscServer'

/**
 * RSC build. Step 4.
 * Copy CSS assets from server to client
 */
export function rscBuildCopyCssAssets(
  serverBuildOutput: Awaited<ReturnType<typeof buildForRscServer>>,
  webDist: string,
  webDistServer: string
) {
  // TODO (RSC) Some css is now duplicated in two files (i.e. for client
  // components). Probably don't want that.
  // Also not sure if this works on "soft" rerenders (i.e. not a full page
  // load)
  return Promise.all(
    serverBuildOutput
      .filter((item) => {
        return item.type === 'asset' && item.fileName.endsWith('.css')
      })
      .map((cssAsset) => {
        return fs.copyFile(
          path.join(webDistServer, cssAsset.fileName),
          path.join(webDist, cssAsset.fileName)
        )
      })
  )
}
