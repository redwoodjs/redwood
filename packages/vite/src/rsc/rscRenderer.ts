import path from 'node:path'
import type { ReadableStream } from 'node:stream/web'

import { createElement } from 'react'

import { renderToReadableStream } from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

import { getEntriesFromDist } from '../lib/entries.js'
import { StatusError } from '../lib/StatusError.js'

export type RenderInput = {
  rscId?: string | undefined
  rsaId?: string | undefined
  args?: unknown[] | undefined
}

let absoluteClientEntries: Record<string, string> = {}

export function renderRscToStream(input: RenderInput): Promise<ReadableStream> {
  return input.rscId ? renderRsc(input) : executeRsa(input)
}

async function loadServerFile(filePath: string) {
  console.log('rscRenderer.ts loadServerFile filePath', filePath)
  return import(`file://${filePath}`)
}

const getRoutesComponent: any = async () => {
  const serverEntries = await getEntriesFromDist()
  console.log('rscRenderer.ts serverEntries', serverEntries)

  const routesPath = path.join(
    getPaths().web.distRsc,
    serverEntries['__rwjs__Routes'],
  )

  if (!routesPath) {
    throw new StatusError('No entry found for __rwjs__Routes', 404)
  }

  const routes = await loadServerFile(routesPath)

  return routes.default
}

export async function setClientEntries(): Promise<void> {
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

      return [fullKey, '/' + val]
    }),
  )

  console.log(
    'setClientEntries :: absoluteClientEntries',
    absoluteClientEntries,
  )
}

function getBundlerConfig() {
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

        const filePathSlash = filePath.replaceAll('\\', '/')
        const id = absoluteClientEntries[filePathSlash]

        console.log('absoluteClientEntries', absoluteClientEntries)
        console.log('filePath', filePathSlash)

        if (!id) {
          throw new Error('No client entry found for ' + filePathSlash)
        }

        console.log('rscRenderer proxy id', id)
        // id /assets/rsc0-beb48afe.js
        return { id, chunks: [id], name, async: true }
      },
    },
  )

  return bundlerConfig
}

interface RscModel {
  __rwjs__Routes: React.ReactElement
  __rwjs__rsa_data?: unknown
}

async function renderRsc(input: RenderInput): Promise<ReadableStream> {
  if (input.rsaId || !input.args) {
    throw new Error(
      "Unexpected input. Can't request both RSCs and execute RSAs at the same time.",
    )
  }

  if (!input.rscId) {
    throw new Error('Unexpected input. Missing rscId or props.')
  }

  console.log('renderRsc input', input)

  const serverRoutes = await getRoutesComponent()
  const model: RscModel = {
    __rwjs__Routes: createElement(serverRoutes),
  }

  console.log('rscRenderer.ts renderRsc model', model)

  return renderToReadableStream(model, getBundlerConfig())
  // TODO (RSC): We used to transform() the stream here to remove
  // "prefixToRemove", which was the common base path to all filenames. We
  // then added it back in handleRsc with a simple
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

async function executeRsa(input: RenderInput): Promise<ReadableStream> {
  console.log('executeRsa input', input)

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
  console.log('rscRenderer.ts method', method)
  console.log('rscRenderer.ts args', ...input.args)

  const data = await method(...input.args)
  console.log('rscRenderer.ts rsa return data', data)

  const serverRoutes = await getRoutesComponent()
  console.log('rscRenderer.ts executeRsa serverRoutes', serverRoutes)
  const model: RscModel = {
    __rwjs__Routes: createElement(serverRoutes),
    __rwjs__rsa_data: data,
  }
  console.log('rscRenderer.ts executeRsa model', model)

  return renderToReadableStream(model, getBundlerConfig())
}
