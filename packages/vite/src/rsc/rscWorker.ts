// This is a dedicated worker for RSCs.
// It's needed because the main process can't be loaded with
// `--condition react-server`. If we did try to do that the main process
// couldn't do SSR because it would be missing client-side React functions
// like `useState` and `createContext`.
import type { Buffer } from 'node:buffer'
import path from 'node:path'
import { Writable } from 'node:stream'
import { parentPort } from 'node:worker_threads'

import { createElement } from 'react'

import RSDWServer from 'react-server-dom-webpack/server'
import type { ResolvedConfig } from 'vite'
import { resolveConfig } from 'vite'

import { getPaths } from '@redwoodjs/project-config'
import {
  createPerRequestMap,
  createServerStorage,
} from '@redwoodjs/server-store'

import { getEntriesFromDist } from '../lib/entries.js'
import { registerFwGlobalsAndShims } from '../lib/registerFwGlobalsAndShims.js'
import { StatusError } from '../lib/StatusError.js'

import type {
  MessageReq,
  MessageRes,
  RenderInput,
} from './rscWorkerCommunication.js'

// TODO (RSC): We should look into importing renderToReadableStream from
// 'react-server-dom-webpack/server.browser' so that we can respond with web
// streams
const { renderToPipeableStream } = RSDWServer

let absoluteClientEntries: Record<string, string> = {}
const serverStorage = createServerStorage()

type PipeableStream = { pipe<T extends Writable>(destination: T): T }

const handleSetClientEntries = async ({
  id,
}: MessageReq & { type: 'setClientEntries' }) => {
  try {
    await setClientEntries()

    if (!parentPort) {
      throw new Error('parentPort is undefined')
    }

    const message: MessageRes = { id, type: 'end' }
    parentPort.postMessage(message)
  } catch (err) {
    if (!parentPort) {
      throw new Error('parentPort is undefined')
    }

    const message: MessageRes = { id, type: 'err', err }
    parentPort.postMessage(message)
  }
}

const handleRender = async ({ id, input }: MessageReq & { type: 'render' }) => {
  console.log('handleRender', id, input)

  // Assumes that handleRender is only called once per request!
  const reqMap = createPerRequestMap({
    headers: input.serverState.headersInit,
    fullUrl: input.serverState.fullUrl,
    serverAuthState: input.serverState.serverAuthState,
  })

  serverStorage.run(reqMap, async () => {
    try {
      // @MARK run render with map initialised
      const pipeable = input.rscId
        ? await renderRsc(input)
        : await handleRsa(input)

      const writable = new Writable({
        write(chunk, encoding, callback) {
          if (encoding !== ('buffer' as any)) {
            throw new Error('Unknown encoding')
          }

          if (!parentPort) {
            throw new Error('parentPort is undefined')
          }

          const buffer: Buffer = chunk
          const message: MessageRes = {
            id,
            type: 'buf',
            buf: buffer.buffer,
            offset: buffer.byteOffset,
            len: buffer.length,
          }
          parentPort.postMessage(message, [message.buf])
          callback()
        },
        final(callback) {
          if (!parentPort) {
            throw new Error('parentPort is undefined')
          }

          const message: MessageRes = { id, type: 'end' }
          parentPort.postMessage(message)
          callback()
        },
      })

      pipeable.pipe(writable)
    } catch (err) {
      if (!parentPort) {
        throw new Error('parentPort is undefined')
      }

      const message: MessageRes = { id, type: 'err', err }
      parentPort.postMessage(message)
    }
  })
}

// This is a worker, so it doesn't share the same global variables as the main
// server. So we have to register them here again.
registerFwGlobalsAndShims()

const shutdown = async () => {
  if (!parentPort) {
    throw new Error('parentPort is undefined')
  }

  parentPort.close()
}

async function loadServerFile(filePath: string) {
  return import(`file://${filePath}`)
}

if (!parentPort) {
  throw new Error('parentPort is undefined')
}

parentPort.on('message', (message: MessageReq) => {
  console.log('message', message)

  if (message.type === 'shutdown') {
    shutdown()
  } else if (message.type === 'setClientEntries') {
    handleSetClientEntries(message)
  } else if (message.type === 'render') {
    handleRender(message)
  }
})

// Let me re-assign root
type ConfigType = Omit<ResolvedConfig, 'root'> & { root: string }

/**
 * Gets the Vite config.
 * Makes sure root is configured properly and then caches the result
 */
async function getViteConfig() {
  let cachedConfig: ConfigType | null = null

  return (async () => {
    if (cachedConfig) {
      return cachedConfig
    }

    cachedConfig = await resolveConfig({}, 'serve')
    setRootInConfig(cachedConfig)

    return cachedConfig
  })()
}

const getRoutesComponent: any = async () => {
  // TODO (RSC): Get rid of this when we only use the worker in dev mode
  const isDev = Object.keys(absoluteClientEntries).length === 0

  let routesPath: string | undefined
  if (isDev) {
    routesPath = getPaths().web.routes
  } else {
    const serverEntries = await getEntriesFromDist()
    console.log('rscWorker.ts serverEntries', serverEntries)

    routesPath = path.join(
      getPaths().web.distRsc,
      serverEntries['__rwjs__Routes'],
    )
  }

  if (!routesPath) {
    throw new StatusError('No entry found for __rwjs__Routes', 404)
  }

  const routes = await loadServerFile(routesPath)

  return routes.default
}

function resolveClientEntryForProd(
  filePath: string,
  config: Awaited<ReturnType<typeof resolveConfig>>,
) {
  const filePathSlash = filePath.replaceAll('\\', '/')
  const clientEntry = absoluteClientEntries[filePathSlash]

  console.log('absoluteClientEntries', absoluteClientEntries)
  console.log('filePath', filePathSlash)

  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return config.base + path.relative(config.root, filePathSlash)
    }

    throw new Error('No client entry found for ' + filePathSlash)
  }

  return clientEntry
}

function fileURLToFilePath(fileURL: string) {
  if (!fileURL.startsWith('file://')) {
    throw new Error('Not a file URL')
  }
  return decodeURI(fileURL.slice('file://'.length))
}

const ABSOLUTE_WIN32_PATH_REGEXP = /^\/[a-zA-Z]:\//

function encodeFilePathToAbsolute(filePath: string) {
  if (ABSOLUTE_WIN32_PATH_REGEXP.test(filePath)) {
    throw new Error('Unsupported absolute file path')
  }
  if (filePath.startsWith('/')) {
    return filePath
  }
  return '/' + filePath
}

function resolveClientEntryForDev(id: string, config: { base: string }) {
  console.log('resolveClientEntryForDev config.base', config.base)
  const filePath = id.startsWith('file://') ? fileURLToFilePath(id) : id
  // HACK this relies on Vite's internal implementation detail.
  return config.base + '@fs' + encodeFilePathToAbsolute(filePath)
}

async function setClientEntries(): Promise<void> {
  const config = await getViteConfig()

  const entriesFile = getPaths().web.distRscEntries
  console.log('setClientEntries :: entriesFile', entriesFile)
  const { clientEntries } = await loadServerFile(entriesFile)
  console.log('setClientEntries :: clientEntries', clientEntries)
  if (!clientEntries) {
    throw new Error('Failed to load clientEntries')
  }
  const baseDir = path.dirname(entriesFile)

  // Convert to absolute paths
  absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key)

      if (process.platform === 'win32') {
        fullKey = fullKey.replaceAll('\\', '/')
      }

      return [fullKey, config.base + val]
    }),
  )

  console.log(
    'setClientEntries :: absoluteClientEntries',
    absoluteClientEntries,
  )
}

function setRootInConfig(config: ConfigType) {
  const rwPaths = getPaths()

  // TODO (RSC): Should root be configurable by the user? We probably need it
  // to be different values in different contexts. Should we introduce more
  // config options?
  // config.root currently comes from the user's project, where it in turn
  // comes from our `redwood()` vite plugin defined in index.ts. By default
  // (i.e. in the redwood() plugin) it points to <base>/web/src. But we need it
  // to be just <base>/, so for now we override it here.
  config.root =
    process.platform === 'win32'
      ? rwPaths.base.replaceAll('\\', '/')
      : rwPaths.base
  console.log('config.root', config.root)
  console.log('rwPaths.base', rwPaths.base)
}

function getBundlerConfig(config: ConfigType) {
  // TODO (RSC): Try removing the proxy here and see if it's really necessary.
  // Looks like it'd work to just have a regular object with a getter.
  // Remove the proxy and see what breaks.
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Proxy get encodedId', encodedId)
        const [filePath, name] = encodedId.split('#') as [string, string]
        // filePath /Users/tobbe/dev/waku/examples/01_counter/dist/assets/rsc0.js
        // name Counter

        // TODO (RSC): Get rid of this when we only use the worker in dev mode
        const isDev = Object.keys(absoluteClientEntries).length === 0

        let id: string
        if (isDev) {
          id = resolveClientEntryForDev(filePath, config)
        } else {
          // Needs config.root to be set properly
          id = resolveClientEntryForProd(filePath, config)
        }

        console.log('rscWorker proxy id', id)
        // id /assets/rsc0-beb48afe.js
        return { id, chunks: [id], name, async: true }
      },
    },
  )

  return bundlerConfig
}

async function renderRsc(input: RenderInput): Promise<PipeableStream> {
  if (input.rsaId || !input.args) {
    throw new Error(
      "Unexpected input. Can't request both RSCs and execute RSAs at the same time.",
    )
  }

  if (!input.rscId || !input.props) {
    throw new Error('Unexpected input. Missing rscId or props.')
  }

  console.log('renderRsc input', input)

  const config = await getViteConfig()

  const serverRoutes = await getRoutesComponent()
  const element = createElement(serverRoutes, input.props)

  console.log('rscWorker.ts renderRsc renderRsc props', input.props)
  console.log('rscWorker.ts renderRsc element', element)

  return renderToPipeableStream(element, getBundlerConfig(config))
  // TODO (RSC): We used to transform() the stream here to remove
  // "prefixToRemove", which was the common base path to all filenames. We
  // then added it back in handleRsa with a simple
  // `path.join(config.root, fileId)`. I removed all of that for now to
  // simplify the code. But if we wanted to add it back in the future to save
  // some bytes in all the Flight data we could.
}

interface SerializedFormData {
  __formData__: boolean
  state: Record<string, string | string[]>
}

function isSerializedFormData(data?: unknown): data is SerializedFormData {
  return !!data && (data as SerializedFormData)?.__formData__
}

async function handleRsa(input: RenderInput): Promise<PipeableStream> {
  console.log('handleRsa input', input)

  if (!input.rsaId || !input.args) {
    throw new Error('Unexpected input')
  }

  const [fileName, actionName] = input.rsaId.split('#')
  console.log('Server Action fileName', fileName, 'actionName', actionName)
  const module = await loadServerFile(fileName)

  if (isSerializedFormData(input.args[0])) {
    const formData = new FormData()

    Object.entries(input.args[0].state).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          formData.append(key, v)
        })
      } else {
        formData.append(key, value)
      }
    })

    input.args[0] = formData
  }

  const method = module[actionName] || module
  console.log('rscWorker.ts method', method)
  console.log('rscWorker.ts args', ...input.args)

  const data = await method(...input.args)
  console.log('rscWorker.ts rsa return data', data)
  const config = await getViteConfig()

  const serverRoutes = await getRoutesComponent()
  console.log('rscWorker.ts handleRsa serverRoutes', serverRoutes)
  const elements = {
    Routes: createElement(serverRoutes, {
      location: { pathname: '/', search: '' },
    }),
    __rwjs__rsa_data: data,
  }
  console.log('rscWorker.ts handleRsa elements', elements)

  return renderToPipeableStream(elements, getBundlerConfig(config))
}
