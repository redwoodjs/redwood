import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getPaths } from '@redwoodjs/project-config'

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

/**
 *
 * See vite/streamHelpers.ts.
 *
 * This function ensures we load the same version of rsdw_client to prevent multiple instances of React
 */
export async function importReact() {
  const distSsr = getPaths().web.distSsr
  const reactPath = makeFilePath(path.join(distSsr, '__rwjs__react.mjs'))

  return (await import(reactPath)).default
}

/**
 *
 * See vite/streamHelpers.ts.
 *
 * This function ensures we load the same version of rsdw_client to prevent multiple instances of React
 */
export async function importRsdwClient() {
  const distSsr = getPaths().web.distSsr
  const rsdwClientPath = makeFilePath(
    path.join(distSsr, '__rwjs__rsdw-client.mjs'),
  )

  return (await import(rsdwClientPath)).default
}
