import fs from 'fs/promises'

import type { rscBuildClient } from './rscBuildClient'
import type { rscBuildServer } from './rscBuildServer'

/**
 * RSC build. Step 5.
 * Append a mapping of server asset names to client asset names to the
 * `web/dist/server/entries.js` file.
 */
export function rscBuildClientEntriesMappings(
  clientBuildOutput: Awaited<ReturnType<typeof rscBuildClient>>,
  serverBuildOutput: Awaited<ReturnType<typeof rscBuildServer>>,
  clientEntryFiles: Record<string, string>,
  webDistServerEntries: string
) {
  console.log('\n')
  console.log('5. rscBuildClientEntriesMapping')
  console.log('===============================\n')

  const clientEntries: Record<string, string> = {}
  for (const item of clientBuildOutput) {
    const { name, fileName } = item
    const entryFile =
      name &&
      // TODO (RSC) Can't we just compare the names? `item.name === name`
      serverBuildOutput.find(
        (item) =>
          'moduleIds' in item &&
          item.moduleIds.includes(clientEntryFiles[name] as string)
      )?.fileName

    if (entryFile) {
      console.log('entryFile', entryFile)
      if (process.platform === 'win32') {
        const entryFileSlash = entryFile.replaceAll('\\', '/')
        console.log('entryFileSlash', entryFileSlash)
        // Prevent errors on Windows like
        // Error: No client entry found for D:/a/redwood/rsc-project/web/dist/server/assets/rsc0.js
        clientEntries[entryFileSlash] = fileName
      } else {
        clientEntries[entryFile] = fileName
      }
    }
  }

  console.log('clientEntries', clientEntries)

  return fs.appendFile(
    webDistServerEntries,
    `export const clientEntries=${JSON.stringify(clientEntries)};`
  )
}
