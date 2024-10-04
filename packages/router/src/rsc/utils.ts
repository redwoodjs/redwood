import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { default as RSDWServerModule } from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

type RSDWServerType = typeof RSDWServerModule

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
  if (globalThis.__rwjs__vite_ssr_runtime) {
    const reactMod = await import('react')
    console.log('rsc/utils.ts reactMod', reactMod.default)
    return reactMod.default
    // return (await globalThis.__rwjs__vite_ssr_runtime.executeUrl('react'))
    //   .default
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
  if (globalThis.__rwjs__vite_ssr_runtime) {
    // const rsdwcMod = await globalThis.__rwjs__vite_ssr_runtime.executeUrl(
    //   'react-server-dom-webpack/client.edge',
    //   // '/Users/tobbe/dev/redwood/redwood/packages/router/vite-fix/react-server-dom-webpack.client.edge',
    // )
    //
    // return rsdwcMod.default
    const rsdwcMod = await import('react-server-dom-webpack/client.edge')
    return rsdwcMod.default
  }

  const distSsr = getPaths().web.distSsr
  const rsdwClientPath = makeFilePath(
    path.join(distSsr, '__rwjs__rsdw-client.mjs'),
  )

  return (await import(rsdwClientPath)).default
}

export async function importRsdwServer() {
  if (globalThis.__rwjs__vite_rsc_runtime) {
    const rsdwServerMod = await globalThis.__rwjs__vite_rsc_runtime.executeUrl(
      // await globalThis.__rwjs__vite_rsc_server.ssrLoadModule(
      'react-server-dom-webpack/server.edge',
      // '/Users/tobbe/dev/redwood/redwood/packages/router/vite-fix/react-server-dom-webpack.server.edge',
      // '../../vite-fix/react-server-dom-webpack.server.edge',
    )

    return rsdwServerMod.default as RSDWServerType
  } else {
    // We need to do this weird import dance because we need to import a version
    // of react-server-dom-webpack/server.edge that has been built with the
    // `react-server` condition. If we just did a regular import, we'd get the
    // generic version in node_modules, and it'd throw an error about not being
    // run in an environment with the `react-server` condition.
    const dynamicImport = ''
    return import(
      /* @vite-ignore */
      dynamicImport + 'react-server-dom-webpack/server.edge'
    )
  }
}
