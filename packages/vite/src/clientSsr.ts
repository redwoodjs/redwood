import path from 'node:path'

import type { default as RSDWClientModule } from 'react-server-dom-webpack/client.edge'
import type { default as RSDWServerModule } from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

import { getRscStylesheetLinkGenerator } from './rsc/rscCss.js'
import { moduleMap } from './streaming/ssrModuleMap.js'
import { importModule } from './streaming/streamHelpers.js'
import { makeFilePath } from './utils.js'

type RSDWClientType = typeof RSDWClientModule
type RSDWServerType = typeof RSDWServerModule

async function getEntries() {
  const entriesPath = getPaths().web.distRscEntries
  const entries = await import(makeFilePath(entriesPath))
  return entries
}

async function getRoutesComponent<TProps>(): Promise<
  React.FunctionComponent<TProps>
> {
  const { serverEntries } = await getEntries()
  const entryPath = path.join(
    getPaths().web.distRsc,
    serverEntries['__rwjs__Routes'],
  )
  console.log('getRoutesComponent entryPath', entryPath)
  const routesModule = await import(makeFilePath(entryPath))

  return routesModule.default
}

// This gets executed in an RSC server "world" and should return the path to
// the chunk in the client/browser "world"
function resolveClientEntryForProd(
  filePath: string,
  clientEntries: Record<string, string>,
) {
  const basePath = getPaths().web.distServer
  const entriesFile = getPaths().web.distRscEntries
  const baseDir = path.dirname(entriesFile)
  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key)

      if (process.platform === 'win32') {
        fullKey = fullKey.replaceAll('\\', '/')
      }

      return [fullKey, basePath + path.sep + val]
    }),
  )

  const filePathSlash = filePath.replaceAll('\\', '/')
  const clientEntry = absoluteClientEntries[filePathSlash]

  console.log('resolveClientEntryForProd during SSR - filePath', clientEntry)

  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return basePath + path.relative(getPaths().base, filePathSlash)
    }

    throw new Error('No client entry found for ' + filePathSlash)
  }

  return clientEntry
}

// TODO (RSC): Make our own module loading use the same cache as the webpack
// shim for performance
// const moduleLoading = (globalThis as any).__webpack_module_loading__
// const moduleCache = (globalThis as any).__webpack_module_cache__

const rscCache = new Map<string, Thenable<React.ReactElement>>()

export async function renderRoutesFromDist<TProps extends Record<string, any>>(
  pathname: string,
) {
  console.log('renderRoutesFromDist pathname', pathname)

  const cached = rscCache.get(pathname)
  if (cached) {
    return cached
  }

  const cssLinks = getRscStylesheetLinkGenerator()()
  const Routes = await getRoutesComponent<TProps>()

  console.log('clientSsr.ts getEntries()', await getEntries())
  const clientEntries = (await getEntries()).ssrEntries

  // TODO (RSC): Try removing the proxy here and see if it's really necessary.
  // Looks like it'd work to just have a regular object with a getter.
  // Remove the proxy and see what breaks.
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Proxy get encodedId', encodedId)
        const [filePath, name] = encodedId.split('#') as [string, string]
        // filePath /Users/tobbe/tmp/test-project-rsc-kitchen-sink/web/dist/rsc/assets/rsc-AboutCounter.tsx-1.mjs
        // name AboutCounter

        const id = resolveClientEntryForProd(filePath, clientEntries)

        console.log('clientSsr.ts::Proxy id', id)
        // id /Users/tobbe/tmp/test-project-rsc-kitchen-sink/web/dist/client/assets/rsc-AboutCounter.tsx-1-4kTKU8GC.mjs
        return { id, chunks: [id], name, async: true }
      },
    },
  )

  const { createElement }: React = await importModule('__rwjs__react')

  // We need to do this weird import dance because we need to import a version
  // of react-server-dom-webpack/server.edge that has been built with the
  // `react-server` condition. If we just did a regular import, we'd get the
  // generic version in node_modules, and it'd throw an error about not being
  // run in an environment with the `react-server` condition.
  const dynamicImport = ''
  const { renderToReadableStream }: RSDWServerType = await import(
    /* @vite-ignore */
    dynamicImport + 'react-server-dom-webpack/server.edge'
  )

  console.log('clientSsr.ts right before renderToReadableStream')
  // We're in clientSsr.ts, but we're supposed to be pretending we're in the
  // RSC server "world" and that `stream` comes from `fetch`. So this is us
  // emulating the reply (stream) you'd get from a fetch call.
  const stream = renderToReadableStream(
    // createElement(layout, undefined, createElement(page, props)),
    // @ts-expect-error - WIP
    createElement(Routes, {
      // TODO (RSC): Include a more complete location object here. At least
      // search params as well
      // TODO (RSC): Get rid of this when the router can just use
      // useLocation()
      location: { pathname },
      css: cssLinks,
    }),
    bundlerConfig,
  )

  // We have to do this weird import thing because we need a version of
  // react-server-dom-webpack/client.edge that uses the same bundled version
  // of React as all the client components. Also see comment in
  // streamHelpers.ts about the rd-server import for some more context
  const { createFromReadableStream }: RSDWClientType = await importModule(
    '__rwjs__rsdw-client',
  )

  // Here we use `createFromReadableStream`, which is equivalent to
  // `createFromFetch` as used in the browser
  const data = createFromReadableStream(stream, {
    ssrManifest: { moduleMap, moduleLoading: null },
  })

  // TODO (RSC): Since this is SSR, do we need caching?
  rscCache.set(pathname, data)

  return data
}
