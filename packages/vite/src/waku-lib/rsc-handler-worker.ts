// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
// import fs from 'node:fs'
import path from 'node:path'
import { Writable } from 'node:stream'
import { parentPort } from 'node:worker_threads'

import { createElement } from 'react'

import RSDWServer from 'react-server-dom-webpack/server'
import { createServer } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import { defineEntries } from '../waku-server'
// import type { unstable_GetCustomModules } from '../waku-server'

import { configFileConfig, resolveConfig } from './config'
// import type { RenderInput, MessageReq, MessageRes } from './rsc-handler'
import type { RenderInput, MessageRes } from './rsc-handler'
// import { transformRsfId, generatePrefetchCode } from './rsc-utils'
import { transformRsfId } from './rsc-utils'
import { rscTransformPlugin, rscReloadPlugin } from './vite-plugin-rsc'

const { renderToPipeableStream } = RSDWServer

type Entries = { default: ReturnType<typeof defineEntries> }
type PipeableStream = { pipe<T extends Writable>(destination: T): T }

// const handleSetClientEntries = async (
//   mesg: MessageReq & { type: 'setClientEntries' }
// ) => {
//   const { id, value } = mesg
//   try {
//     await setClientEntries(value)

//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const message: MessageRes = { id, type: 'end' }
//     parentPort.postMessage(message)
//   } catch (err) {
//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const message: MessageRes = { id, type: 'err', err }
//     parentPort.postMessage(message)
//   }
// }

// const handleRender = async (message: MessageReq & { type: 'render' }) => {
//   const { id, input } = message

//   try {
//     const pipeable = await renderRSC(input)
//     const writable = new Writable({
//       write(chunk, encoding, callback) {
//         if (encoding !== ('buffer' as any)) {
//           throw new Error('Unknown encoding')
//         }

//         if (!parentPort) {
//           throw new Error('parentPort is undefined')
//         }

//         const buffer: Buffer = chunk
//         const msg: MessageRes = {
//           id,
//           type: 'buf',
//           buf: buffer.buffer,
//           offset: buffer.byteOffset,
//           len: buffer.length,
//         }
//         parentPort.postMessage(msg, [msg.buf])
//         callback()
//       },
//       final(callback) {
//         if (!parentPort) {
//           throw new Error('parentPort is undefined')
//         }

//         const mesg: MessageRes = { id, type: 'end' }
//         parentPort.postMessage(mesg)
//         callback()
//       },
//     })
//     pipeable.pipe(writable)
//   } catch (err) {
//     if (!parentPort) {
//       throw new Error('parentPort is undefined')
//     }

//     const mesg: MessageRes = { id, type: 'err', err }
//     parentPort.postMessage(mesg)
//   }
// }

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
  ...configFileConfig,
  plugins: [
    rscTransformPlugin(),
    rscReloadPlugin((type) => {
      if (!parentPort) {
        throw new Error('parentPort is undefined')
      }

      const mesg: MessageRes = { type }
      parentPort.postMessage(mesg)
    }),
  ],
  ssr: {
    // FIXME Without this, "use client" directive in waku/router/client
    // is ignored, and some errors occur.
    // Unless we fix this, RSC-capable packages aren't supported.
    // This also seems to cause problems with pnpm.
    noExternal: ['waku'],
  },
  appType: 'custom',
})

// const shutdown = async () => {
//   const vite = await vitePromise
//   await vite.close()
//   if (!parentPort) {
//     throw new Error('parentPort is undefined')
//   }

//   parentPort.close()
// }

const loadServerFile = async (fname: string) => {
  const vite = await vitePromise
  return vite.ssrLoadModule(fname)
}

// if (!parentPort) {
//   throw new Error('parentPort is undefined')
// }

// parentPort.on('message', (mesg: MessageReq) => {
//   if (mesg.type === 'shutdown') {
//     shutdown()
//   } else if (mesg.type === 'setClientEntries') {
//     handleSetClientEntries(mesg)
//   } else if (mesg.type === 'render') {
//     handleRender(mesg)
//   } else if (mesg.type === 'getCustomModules') {
//     handleGetCustomModules(mesg)
//   } else if (mesg.type === 'build') {
//     handleBuild(mesg)
//   }
// })

const configPromise = resolveConfig('serve')

const getEntriesFile = async (
  config: Awaited<ReturnType<typeof resolveConfig>>,
  isBuild: boolean
) => {
  const rwPaths = getPaths()

  if (isBuild) {
    return path.join(
      config.root,
      config.build.outDir,
      config.framework.entriesJs
    )
  }

  // TODO: Don't hardcode the name of the entries file
  return path.join(rwPaths.web.distServer, 'entries.js') // path.join(config.root, config.framework.entriesJs)
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
  throw new Error('No function component found')
}

let absoluteClientEntries: Record<string, string> = {}

const resolveClientEntry = (
  config: Awaited<ReturnType<typeof resolveConfig>>,
  filePath: string
) => {
  const clientEntry = absoluteClientEntries[filePath]
  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return config.base + path.relative(config.root, filePath)
    }
    throw new Error('No client entry found for ' + filePath)
  }
  return clientEntry
}

export async function setClientEntries(
  value: 'load' | Record<string, string>
): Promise<void> {
  if (value !== 'load') {
    absoluteClientEntries = value
    return
  }
  const config = await configPromise
  const entriesFile = await getEntriesFile(config, false)
  console.log('entriesFile', entriesFile)
  const { clientEntries } = await loadServerFile(entriesFile)
  if (!clientEntries) {
    throw new Error('Failed to load clientEntries')
  }
  const baseDir = path.dirname(entriesFile)
  absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => [
      path.join(baseDir, key),
      config.base + val,
    ])
  )

  console.log('absoluteClientEntries', absoluteClientEntries)
}

export async function renderRSC(input: RenderInput): Promise<PipeableStream> {
  const config = await configPromise
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        console.log('Proxy get', encodedId)
        const [filePath, name] = encodedId.split('#') as [string, string]
        // filePath /Users/tobbe/dev/waku/examples/01_counter/dist/assets/rsc0.js
        // name Counter
        const id = resolveClientEntry(config, filePath)
        // id /assets/rsc0-beb48afe.js
        return { id, chunks: [id], name, async: true }
      },
    }
  )

  if (input.rsfId && input.args) {
    const [fileId, name] = input.rsfId.split('#')
    const fname = path.join(config.root, fileId)
    const mod = await loadServerFile(fname)
    const data = await (mod[name] || mod)(...input.args)
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

// async function getCustomModulesRSC(): Promise<{ [name: string]: string }> {
//   const config = await configPromise
//   const entriesFile = await getEntriesFile(config, false)
//   const {
//     default: { unstable_getCustomModules: getCustomModules },
//   } = await (loadServerFile(entriesFile) as Promise<{
//     default: Entries['default'] & {
//       unstable_getCustomModules?: unstable_GetCustomModules
//     }
//   }>)
//   if (!getCustomModules) {
//     return {}
//   }
//   const modules = await getCustomModules()
//   return modules
// }

// // FIXME this may take too much responsibility
// async function buildRSC(): Promise<void> {
//   const config = await resolveConfig('build')
//   const basePath = config.base + config.framework.rscPrefix
//   const distEntriesFile = await getEntriesFile(config, true)
//   const {
//     default: { getBuilder },
//   } = await (loadServerFile(distEntriesFile) as Promise<Entries>)
//   if (!getBuilder) {
//     console.warn(
//       "getBuilder is undefined. It's recommended for optimization and sometimes required."
//     )
//     return
//   }

//   // FIXME this doesn't seem an ideal solution
//   const decodeId = (encodedId: string): [id: string, name: string] => {
//     const [filePath, name] = encodedId.split('#') as [string, string]
//     const id = resolveClientEntry(config, filePath)
//     return [id, name]
//   }

//   const pathMap = await getBuilder(decodeId)
//   const clientModuleMap = new Map<string, Set<string>>()
//   const addClientModule = (pathStr: string, id: string) => {
//     let idSet = clientModuleMap.get(pathStr)
//     if (!idSet) {
//       idSet = new Set()
//       clientModuleMap.set(pathStr, idSet)
//     }
//     idSet.add(id)
//   }
//   await Promise.all(
//     Object.entries(pathMap).map(async ([pathStr, { elements }]) => {
//       for (const [rscId, props] of elements || []) {
//         // FIXME we blindly expect JSON.stringify usage is deterministic
//         const serializedProps = JSON.stringify(props)
//         const searchParams = new URLSearchParams()
//         searchParams.set('props', serializedProps)
//         const destFile = path.join(
//           config.root,
//           config.build.outDir,
//           config.framework.outPublic,
//           config.framework.rscPrefix,
//           decodeURIComponent(rscId),
//           decodeURIComponent(`${searchParams}`)
//         )
//         fs.mkdirSync(path.dirname(destFile), { recursive: true })
//         const bundlerConfig = new Proxy(
//           {},
//           {
//             get(_target, encodedId: string) {
//               const [id, name] = decodeId(encodedId)
//               addClientModule(pathStr, id)
//               return { id, chunks: [id], name, async: true }
//             },
//           }
//         )
//         const component = await getFunctionComponent(rscId, config, true)
//         const pipeable = renderToPipeableStream(
//           createElement(component, props as any),
//           bundlerConfig
//         ).pipe(transformRsfId(path.join(config.root, config.build.outDir)))
//         await new Promise<void>((resolve, reject) => {
//           const stream = fs.createWriteStream(destFile)
//           stream.on('finish', resolve)
//           stream.on('error', reject)
//           pipeable.pipe(stream)
//         })
//       }
//     })
//   )

//   const publicIndexHtmlFile = path.join(
//     config.root,
//     config.build.outDir,
//     config.framework.outPublic,
//     config.framework.indexHtml
//   )
//   const publicIndexHtml = fs.readFileSync(publicIndexHtmlFile, {
//     encoding: 'utf8',
//   })
//   await Promise.all(
//     Object.entries(pathMap).map(async ([pathStr, { elements, customCode }]) => {
//       const destFile = path.join(
//         config.root,
//         config.build.outDir,
//         config.framework.outPublic,
//         pathStr,
//         pathStr.endsWith('/') ? 'index.html' : ''
//       )
//       let data = ''
//       if (fs.existsSync(destFile)) {
//         data = fs.readFileSync(destFile, { encoding: 'utf8' })
//       } else {
//         fs.mkdirSync(path.dirname(destFile), { recursive: true })
//         data = publicIndexHtml
//       }
//       const code =
//         generatePrefetchCode(
//           basePath,
//           Array.from(elements || []).flatMap(([rscId, props, skipPrefetch]) => {
//             if (skipPrefetch) {
//               return []
//             }
//             return [[rscId, props]]
//           }),
//           clientModuleMap.get(pathStr) || []
//         ) + (customCode || '')
//       if (code) {
//         // HACK is this too naive to inject script code?
//         data = data.replace(/<\/body>/, `<script>${code}</script></body>`)
//       }
//       fs.writeFileSync(destFile, data, { encoding: 'utf8' })
//     })
//   )
// }
