import fs from 'fs/promises'

import type { rscBuildClient } from './rscBuildClient'
import type { rscBuildServer } from './rscBuildServer'

export function rscBuildClientEntriesFile(
  clientBuildOutput: Awaited<ReturnType<typeof rscBuildClient>>,
  serverBuildOutput: Awaited<ReturnType<typeof rscBuildServer>>,
  clientEntryFiles: Record<string, string>,
  webDistEntries: string
) {
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
    webDistEntries,
    `export const clientEntries=${JSON.stringify(clientEntries)};`
  )
}
