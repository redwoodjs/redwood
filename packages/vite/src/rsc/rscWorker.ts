// This is a dedicated worker for RSCs.
// It's needed because the main process can't be loaded with
// `--condition react-server`. If we did try to do that the main process
// couldn't do SSR because it would be missing client-side React functions
// like `useState` and `createContext`.
import { Buffer } from 'node:buffer'
import { parentPort } from 'node:worker_threads'

import {
  createPerRequestMap,
  createServerStorage,
} from '@redwoodjs/server-store'

import { registerFwGlobalsAndShims } from '../lib/registerFwGlobalsAndShims.js'

import { executeRsa, renderRsc, setClientEntries } from './rscRenderer.js'
import type { MessageReq, MessageRes } from './rscWorkerCommunication.js'

const serverStorage = createServerStorage()

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
      const readable = input.rscId
        ? await renderRsc(input)
        : await executeRsa(input)

      const writable = new WritableStream({
        write(chunk) {
          if (!parentPort) {
            throw new Error('parentPort is undefined')
          }

          const buffer = Buffer.from(chunk)
          const message: MessageRes = {
            id,
            type: 'buf',
            buf: buffer.buffer,
            offset: buffer.byteOffset,
            len: buffer.length,
          }
          parentPort.postMessage(message, [message.buf])
        },
        close() {
          if (!parentPort) {
            throw new Error('parentPort is undefined')
          }

          const message: MessageRes = { id, type: 'end' }
          parentPort.postMessage(message)
        },
      })

      readable.pipeTo(writable)
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

if (!parentPort) {
  throw new Error('parentPort is undefined')
}

parentPort.on('message', (message: MessageReq) => {
  console.log('message', message)

  if (message.type === 'setClientEntries') {
    handleSetClientEntries(message)
  } else if (message.type === 'render') {
    handleRender(message)
  }
})
