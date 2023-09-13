// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
import { PassThrough } from 'node:stream'
import type { Readable } from 'node:stream'
import { Worker } from 'node:worker_threads'

const worker = new Worker(new URL('rsc-handler-worker.js', import.meta.url), {
  execArgv: ['--conditions', 'react-server'],
})

export type RenderInput<
  Props extends Record<string, unknown> = Record<string, unknown>
> = {
  rscId?: string | undefined
  props?: Props | undefined
  rsfId?: string | undefined
  args?: unknown[] | undefined
}

type CustomModules = {
  [name: string]: string
}

export type MessageReq =
  | { type: 'shutdown' }
  | {
      id: number
      type: 'setClientEntries'
      value: 'load' | Record<string, string>
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

const messageCallbacks = new Map<number, (mesg: MessageRes) => void>()

worker.on('message', (mesg: MessageRes) => {
  if ('id' in mesg) {
    messageCallbacks.get(mesg.id)?.(mesg)
  }
})

export function registerReloadCallback(fn: (type: 'full-reload') => void) {
  const listener = (mesg: MessageRes) => {
    if (mesg.type === 'full-reload') {
      fn(mesg.type)
    }
  }
  worker.on('message', listener)
  return () => worker.off('message', listener)
}

export function shutdown() {
  return new Promise<void>((resolve) => {
    worker.on('close', resolve)
    const mesg: MessageReq = { type: 'shutdown' }
    worker.postMessage(mesg)
  })
}

let nextId = 1

export function setClientEntries(
  value: 'load' | Record<string, string>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const id = nextId++
    messageCallbacks.set(id, (mesg) => {
      if (mesg.type === 'end') {
        resolve()
        messageCallbacks.delete(id)
      } else if (mesg.type === 'err') {
        reject(mesg.err)
        messageCallbacks.delete(id)
      }
    })
    const mesg: MessageReq = { id, type: 'setClientEntries', value }
    worker.postMessage(mesg)
  })
}

export function renderRSC(input: RenderInput): Readable {
  const id = nextId++
  const passthrough = new PassThrough()
  messageCallbacks.set(id, (mesg) => {
    if (mesg.type === 'buf') {
      passthrough.write(Buffer.from(mesg.buf, mesg.offset, mesg.len))
    } else if (mesg.type === 'end') {
      passthrough.end()
      messageCallbacks.delete(id)
    } else if (mesg.type === 'err') {
      passthrough.destroy(
        mesg.err instanceof Error ? mesg.err : new Error(String(mesg.err))
      )
      messageCallbacks.delete(id)
    }
  })
  const mesg: MessageReq = { id, type: 'render', input }
  worker.postMessage(mesg)
  return passthrough
}

export function getCustomModulesRSC(): Promise<CustomModules> {
  return new Promise<CustomModules>((resolve, reject) => {
    const id = nextId++
    messageCallbacks.set(id, (mesg) => {
      if (mesg.type === 'customModules') {
        resolve(mesg.modules)
        messageCallbacks.delete(id)
      } else if (mesg.type === 'err') {
        reject(mesg.err)
        messageCallbacks.delete(id)
      }
    })
    const mesg: MessageReq = { id, type: 'getCustomModules' }
    worker.postMessage(mesg)
  })
}

export function buildRSC(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const id = nextId++
    messageCallbacks.set(id, (mesg) => {
      if (mesg.type === 'end') {
        resolve()
        messageCallbacks.delete(id)
      } else if (mesg.type === 'err') {
        reject(mesg.err)
        messageCallbacks.delete(id)
      }
    })
    const mesg: MessageReq = { id, type: 'build' }
    worker.postMessage(mesg)
  })
}
