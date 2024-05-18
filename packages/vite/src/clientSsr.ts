import path from 'node:path'

import { createElement } from 'react'

import type { default as RSDWClientModule } from 'react-server-dom-webpack/client.edge'
import type { default as RSDWServerModule } from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

import { StatusError } from './lib/StatusError.js'
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

async function getFunctionComponent<TProps>(
  rscId: string,
): Promise<React.FunctionComponent<TProps>> {
  const { serverEntries } = await getEntries()
  const entryPath = path.join(getPaths().web.distRsc, serverEntries[rscId])
  const mod = await import(makeFilePath(entryPath))

  if (typeof mod === 'function') {
    return mod
  }

  if (typeof mod?.default === 'function') {
    return mod?.default
  }

  // We remove any potential "__rwjs__" prefix as these only exist in the mapping
  // not in the built files. E.g. "__rwjs__ServerEntry" -> "ServerEntry" as we don't
  // export "__rwjs__ServerEntry" in the built file we simply export "ServerEntry"
  rscId = rscId.replace(/^__rwjs__/, '')

  if (typeof mod?.[rscId] === 'function') {
    return mod?.[rscId]
  }

  // TODO (RSC): Making this a 404 error is marked as "HACK" in waku's source
  throw new StatusError('No function component found for ' + rscId, 404)
}

// This gets executed in an RSC server "world" and should return the path to
// the chunk in the client/browser "world"
function resolveClientEntryForProd(
  filePath: string,
  clientEntries: Record<string, string>,
) {
  const basePath = getPaths().web.distClient
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

  console.log('absoluteClientEntries', absoluteClientEntries)
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

export function renderFromDist<TProps extends Record<string, any>>(
  rscId: string,
) {
  const cssLinks = getRscStylesheetLinkGenerator()()

  // Create temporary client component that wraps the component (Page, most
  // likely) returned by the `createFromReadableStream` call.
  const SsrComponent = async (props: TProps) => {
    console.log('SsrComponent', rscId, 'props', props)

    let ServerEntry: React.FunctionComponent<TProps>

    try {
      ServerEntry = await getFunctionComponent<TProps>('__rwjs__ServerEntry')
    } catch (error) {
      console.log('SsrComponent error', error)
      // For now we'll just swallow this error because not all projects will
      // have a ServerRoutes component
      // TODO (RSC): Remove the try/catch and let the error bubble up when
      // we've added server routers to our test projects
      ServerEntry = () => createElement('div', {}, 'Loading')
    }

    console.log('clientSsr.ts getEntries()', await getEntries())
    const clientEntries = (await getEntries()).clientEntries

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

    // We need to do this weird import dance because we need to import a version
    // of react-server-dom-webpack/server.edge that has been built with the
    // `react-server` condition. If we just did a regular import, we'd get the
    // generic version in node_modules, and it'd throw an error about not being
    // run in an environment with the `react-server` condition.
    const { renderToReadableStream }: RSDWServerType =
      await importModule('rsdw-server')

    // We're in client.ts, but we're supposed to be pretending we're in the
    // RSC server "world" and that `stream` comes from `fetch`. So this is
    // us emulating the reply (stream) you'd get from a fetch call.
    const stream = renderToReadableStream(
      // createElement(layout, undefined, createElement(page, props)),
      // @ts-expect-error - WIP
      createElement(ServerEntry, {
        location: { pathname: rscId },
        css: cssLinks,
      }),
      bundlerConfig,
    )

    // We have to do this weird import thing because we need a version of
    // react-server-dom-webpack/client.edge that uses the same bundled version
    // of React as all the client components. Also see comment in
    // streamHelpers.ts about the rd-server import for some more context
    const { createFromReadableStream }: RSDWClientType =
      await importModule('rsdw-client')

    // Here we use `createFromReadableStream`, which is equivalent to
    // `createFromFetch` as used in the browser
    const data = createFromReadableStream(stream, {
      ssrManifest: { moduleMap, moduleLoading: null },
    })

    return data
  }

  return SsrComponent
}
