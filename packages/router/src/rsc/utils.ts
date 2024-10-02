import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getPaths } from '@redwoodjs/project-config'

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}

/**
 * See vite/streamHelpers.ts.
 *
 * This function ensures we load the bundled version of React to prevent
 * multiple instances of React
 */
export async function importReact() {
  if (globalThis.__rwjs__vite_dev_server) {
    return await globalThis.__rwjs__vite_dev_server.ssrLoadModule('react')
  }

  const distSsr = getPaths().web.distSsr
  const reactPath = makeFilePath(path.join(distSsr, '__rwjs__react.mjs'))

  return (await import(reactPath)).default
}

/**
 * See vite/streamHelpers.ts.
 *
 * This function ensures we load the same version of rsdw_client everywhere to
 * prevent multiple instances of React
 */
export async function importRsdwClient() {
  if (globalThis.__rwjs__vite_dev_server) {
    const rsdwcMod = await globalThis.__rwjs__vite_dev_server.ssrLoadModule(
      'react-server-dom-webpack/client.edge',
    )
    return rsdwcMod.default
  }

  const distSsr = getPaths().web.distSsr
  const rsdwClientPath = makeFilePath(
    path.join(distSsr, '__rwjs__rsdw-client.mjs'),
  )

  return (await import(rsdwClientPath)).default
}
