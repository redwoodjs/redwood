// This is a dedicated worker for RSCs.
// It's needed because the main process can't be loaded with
// `--condition react-server`. If we did try to do that the main process
// couldn't do SSR because it would be missing client-side React functions
// like `useState` and `createContext`.

import { Buffer } from 'node:buffer'
import path from 'node:path'
import { Transform, Writable } from 'node:stream'
import { parentPort } from 'node:worker_threads'

import { createElement } from 'react'

import RSDWServer from 'react-server-dom-webpack/server'
import type { ResolvedConfig } from 'vite'
import { createServer, resolveConfig } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import type { defineEntries } from '../entries'
import { StatusError } from '../lib/StatusError'

import { rscTransformPlugin, rscReloadPlugin } from './rscVitePlugins'
import type {
  RenderInput,
  MessageRes,
  MessageReq,
} from './rscWorkerCommunication'

// import type { unstable_GetCustomModules } from '../waku-server'
// import type { RenderInput, MessageReq, MessageRes } from './rsc-handler'
// import { transformRsfId, generatePrefetchCode } from './rsc-utils'

const { renderToPipeableStream } = RSDWServer

type Entries = { default: ReturnType<typeof defineEntries> }
type PipeableStream = { pipe<T extends Writable>(destination: T): T }

const handleSetClientEntries = async ({
  id,
  value,
}: MessageReq & { type: 'setClientEntries' }) => {
  try {
    await setClientEntries(value)

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

  try {
    const pipeable = await renderRsc(input)

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
}

// const handleGetCustomModules = async (
//   mesg: MessageReq & { type: 'getCustomModules' }
// ) => {
//   const { id } = mesg
//   try {
//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const modules = await getCustomModulesRSC()
//     const mesg: MessageRes = { id, type: 'customModules', modules }
//     parentPort.postMessage(mesg)
//   } catch (err) {
//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const mesg: MessageRes = { id, type: 'err', err }
//     parentPort.postMessage(mesg)
//   }
// }

// const handleBuild = async (mesg: MessageReq & { type: 'build' }) => {
//   const { id } = mesg
//   try {
//     await buildRSC()

//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const mesg: MessageRes = { id, type: 'end' }
//     parentPort.postMessage(mesg)
//   } catch (err) {
//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const mesg: MessageRes = { id, type: 'err', err }
//     parentPort.postMessage(mesg)
//   }
// }

const vitePromise = createServer({
  plugins: [
    rscTransformPlugin(),
    rscReloadPlugin((type) => {
      if (!parentPort) {
        throw new Error('parentPort is undefined')
      }

      const message: MessageRes = { type }
      parentPort.postMessage(message)
    }),
  ],
  ssr: {
    resolve: {
      externalConditions: ['react-server'],
    },
  },
  appType: 'custom',
})

const shutdown = async () => {
  const vite = await vitePromise
  await vite.close()
  if (!parentPort) {
    throw new Error('parentPort is undefined')
  }

  parentPort.close()
}

const loadServerFile = async (fname: string) => {
  const vite = await vitePromise
  return vite.ssrLoadModule(fname)
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
    // } else if (message.type === 'getCustomModules') {
    //   handleGetCustomModules(message)
    // } else if (message.type === 'build') {
    //   handleBuild(message)
  }
})

// Let me re-assign root
type ConfigType = Omit<ResolvedConfig, 'root'> & { root: string }
const configPromise: Promise<ConfigType> = resolveConfig({}, 'serve')

const getEntriesFile = async (
  config: Awaited<ReturnType<typeof resolveConfig>>,
  isBuild: boolean
) => {
  const rwPaths = getPaths()

  if (isBuild) {
    // TODO (RSC): Should we make this path configurable? Or at least read
    // from getPaths()?
    return path.join(config.root, config.build.outDir, 'entries.js')
  }

  return rwPaths.web.distServerEntries
}

const getFunctionComponent = async (
  rscId: string,
  config: Awaited<ReturnType<typeof resolveConfig>>,
  isBuild: boolean
) => {
  const entriesFile = await getEntriesFile(config, isBuild)
  const {
    default: { getEntry },
  } = await (loadServerFile(entriesFile) as Promise<Entries>)
  const mod = await getEntry(rscId)
  if (typeof mod === 'function') {
    return mod
  }
  if (typeof mod?.default === 'function') {
    return mod?.default
  }
  // TODO (RSC): Making this a 404 error is marked as "HACK" in waku's source
  throw new StatusError('No function component found', 404)
}

let absoluteClientEntries: Record<string, string> = {}

const resolveClientEntry = (
  config: Awaited<ReturnType<typeof resolveConfig>>,
  filePath: string
) => {
  const clientEntry = absoluteClientEntries[filePath]

  console.log('absoluteClientEntries', absoluteClientEntries)
  console.log('filePath', filePath)

  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return config.base + path.relative(config.root, filePath)
    }

    throw new Error('No client entry found for ' + filePath)
  }

  return clientEntry
}

async function setClientEntries(
  value: 'load' | Record<string, string>
): Promise<void> {
  if (value !== 'load') {
    absoluteClientEntries = value
    return
  }
  const config = await configPromise
  const entriesFile = await getEntriesFile(config, false)
  console.log('setClientEntries :: entriesFile', entriesFile)
  const { clientEntries } = await loadServerFile(entriesFile)
  console.log('setClientEntries :: clientEntries', clientEntries)
  if (!clientEntries) {
    throw new Error('Failed to load clientEntries')
  }
  const baseDir = path.dirname(entriesFile)
  absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key)
      if (process.platform === 'win32') {
        fullKey = fullKey.replaceAll('\\', '/')
      }
      console.log('fullKey', fullKey, 'value', config.base + val)
      return [fullKey, config.base + val]
    })
  )

  console.log(
    'setClientEntries :: absoluteClientEntries',
    absoluteClientEntries
  )
}

interface SerializedFormData {
  __formData__: boolean
  state: Record<string, string | string[]>
}

function isSerializedFormData(data?: unknown): data is SerializedFormData {
  return !!data && (data as SerializedFormData)?.__formData__
}

async function renderRsc(input: RenderInput): Promise<PipeableStream> {
  const rwPaths = getPaths()

  const config = await configPromise
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
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Proxy get', encodedId)
        const [filePath, name] = encodedId.split('#') as [string, string]
        // filePath /Users/tobbe/dev/waku/examples/01_counter/dist/assets/rsc0.js
        // name Counter
        const id = resolveClientEntry(config, filePath)
        console.log('Proxy id', id)
        // id /assets/rsc0-beb48afe.js
        return { id, chunks: [id], name, async: true }
      },
    }
  )

  console.log('renderRsc input', input)

  if (input.rsfId && input.args) {
    const [fileId, name] = input.rsfId.split('#')
    const fname = path.join(config.root, fileId)
    console.log('Server Action, fileId', fileId, 'name', name, 'fname', fname)
    const module = await loadServerFile(fname)

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

    const data = await (module[name] || module)(...input.args)
    if (!input.rscId) {
      return renderToPipeableStream(data, bundlerConfig)
    }
    // continue for mutation mode
  }

  if (input.rscId && input.props) {
    const component = await getFunctionComponent(input.rscId, config, false)
    return renderToPipeableStream(
      createElement(component, input.props),
      bundlerConfig
    ).pipe(transformRsfId(config.root))
  }

  throw new Error('Unexpected input')
}

// HACK Patching stream is very fragile.
// TODO (RSC): Sanitize prefixToRemove to make sure it's safe to use in a
// RegExp (CodeQL is complaining on GitHub)
function transformRsfId(prefixToRemove: string) {
  // Should be something like /home/runner/work/redwood/test-project-rsa
  console.log('prefixToRemove', prefixToRemove)

  return new Transform({
    transform(chunk, encoding, callback) {
      if (encoding !== ('buffer' as any)) {
        throw new Error('Unknown encoding')
      }
      const data = chunk.toString()
      const lines = data.split('\n')
      console.log('lines', lines)
      let changed = false
      for (let i = 0; i < lines.length; ++i) {
        const match = lines[i].match(
          new RegExp(`^([0-9]+):{"id":"${prefixToRemove}(.*?)"(.*)$`)
        )
        if (match) {
          lines[i] = `${match[1]}:{"id":"${match[2]}"${match[3]}`
          changed = true
        }
      }
      callback(null, changed ? Buffer.from(lines.join('\n')) : chunk)
    },
  })
}
