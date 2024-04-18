import { pathToFileURL } from 'node:url'

import type { ViteDevServer } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import type { EntryServer } from './types'

export function stripQueryStringAndHashFromPath(url: string) {
  return url.split('?')[0].split('#')[0]
}

// Check CWD: make sure its the web/ directory
// Without this Postcss can misbehave, and its hard to trace why.
export function ensureProcessDirWeb(webDir: string = getPaths().web.base) {
  if (process.cwd() !== webDir) {
    console.error('⚠️  Warning: CWD is ', process.cwd())
    console.warn('~'.repeat(50))
    console.warn(
      'The cwd must be web/. Please use `yarn rw <command>` or run the command from the web/ directory.',
    )
    console.log(`Changing cwd to ${webDir}....`)
    console.log()

    process.chdir(webDir)
  }
}

export function makeFilePath(path: string): string {
  // Without this, absolute paths can't be imported on Windows
  // https://nodejs.org/api/url.html#urlpathtofileurlpath
  return pathToFileURL(path).href
}

export async function ssrLoadEntryServer(viteDevServer: ViteDevServer) {
  const rwPaths = getPaths()

  if (!rwPaths.web.entryServer) {
    throw new Error('entryServer not defined')
  }

  return viteDevServer.ssrLoadModule(
    rwPaths.web.entryServer,
    // Have to type cast here because ssrLoadModule just returns a generic
    // Record<string, any> type
  ) as Promise<EntryServer>
}
