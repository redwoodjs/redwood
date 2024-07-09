import path from 'node:path'
import type { Readable } from 'node:stream'
import { PassThrough } from 'node:stream'
import { Worker } from 'node:worker_threads'

import type { ServerAuthState } from '@redwoodjs/auth/dist/AuthProvider/ServerAuthProvider.js'

import type { RscFetchProps } from './rscFetchForClientRouter.js'

const worker = new Worker(path.join(__dirname, 'rscWorker.js'), {
  execArgv: [
    '--conditions',
    'react-server',
    '--experimental-loader',
    '@redwoodjs/vite/react-node-loader',
  ],
})

export type RenderInput = {
  rscId?: string | undefined
  props: RscFetchProps | Record<string, unknown>
  rsfId?: string | undefined
  args?: unknown[] | undefined
  serverState: {
    headersInit: Record<string, string>
    fullUrl: string
    serverAuthState: ServerAuthState
  }
}

type CustomModules = {
  [name: string]: string
}

export type MessageReq =
  | { type: 'shutdown' }
  | {
      id: number
      type: 'setClientEntries'
    }
  | {
      id: number
      type: 'render'
      input: RenderInput
    }
  | {
      id: number
      type: 'getCustomModules'
    }
  | {
      id: number
      type: 'build'
    }

export type MessageRes =
  | { type: 'full-reload' }
  | { id: number; type: 'buf'; buf: ArrayBuffer; offset: number; len: number }
  | { id: number; type: 'end' }
  | { id: number; type: 'err'; err: unknown }
  | { id: number; type: 'customModules'; modules: CustomModules }

const messageCallbacks = new Map<number, (message: MessageRes) => void>()

worker.on('message', (message: MessageRes) => {
  if ('id' in message) {
    messageCallbacks.get(message.id)?.(message)
  }
})

export function registerReloadCallback(fn: (type: 'full-reload') => void) {
  const listener = (message: MessageRes) => {
    if (message.type === 'full-reload') {
      fn(message.type)
    }
  }

  worker.on('message', listener)

  return () => worker.off('message', listener)
}

export function shutdown() {
  return new Promise<void>((resolve) => {
    worker.on('close', resolve)

    const message: MessageReq = { type: 'shutdown' }
    worker.postMessage(message)
  })
}

let nextId = 1

/** Set the client entries in the worker (for the server build) */
export function setClientEntries(): Promise<void> {
  // Just making this function async instead of callback based
  return new Promise((resolve, reject) => {
    const id = nextId++

    messageCallbacks.set(id, (message) => {
      if (message.type === 'end') {
        resolve()
        messageCallbacks.delete(id)
      } else if (message.type === 'err') {
        reject(message.err)
        messageCallbacks.delete(id)
      }
    })

    const message: MessageReq = { id, type: 'setClientEntries' }
    worker.postMessage(message)
  })
}

export function renderRsc(input: RenderInput): Readable {
  // TODO (RSC): What's the biggest number JS handles here? What happens when
  // it overflows? Will it just start over at 0? If so, we should be fine. If
  // not, we need to figure out a more robust way to handle this.
  const id = nextId++
  const passthrough = new PassThrough()

  messageCallbacks.set(id, (message) => {
    if (message.type === 'buf') {
      passthrough.write(Buffer.from(message.buf, message.offset, message.len))
    } else if (message.type === 'end') {
      passthrough.end()
      messageCallbacks.delete(id)
    } else if (message.type === 'err') {
      passthrough.destroy(
        message.err instanceof Error
          ? message.err
          : new Error(String(message.err)),
      )
      messageCallbacks.delete(id)
    }
  })

  const message: MessageReq = { id, type: 'render', input }
  worker.postMessage(message)

  return passthrough
}

export function getCustomModulesRSC(): Promise<CustomModules> {
  return new Promise<CustomModules>((resolve, reject) => {
    const id = nextId++
    messageCallbacks.set(id, (message) => {
      if (message.type === 'customModules') {
        resolve(message.modules)
        messageCallbacks.delete(id)
      } else if (message.type === 'err') {
        reject(message.err)
        messageCallbacks.delete(id)
      }
    })
    const message: MessageReq = { id, type: 'getCustomModules' }
    worker.postMessage(message)
  })
}

export function buildRSC(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const id = nextId++
    messageCallbacks.set(id, (message) => {
      if (message.type === 'end') {
        resolve()
        messageCallbacks.delete(id)
      } else if (message.type === 'err') {
        reject(message.err)
        messageCallbacks.delete(id)
      }
    })
    const message: MessageReq = { id, type: 'build' }
    worker.postMessage(message)
  })
}
