import { decodeText } from './encode-decode'

// @TODO: we may need to swithc it out for running on edge like next.js
const queueTask = setImmediate

export function createBufferedTransformStream() {
  let bufferedBytes = new Uint8Array()
  let pendingFlush: Promise<void> | null = null

  const flushBuffer = (
    controller: TransformStreamDefaultController<Uint8Array>
  ) => {
    if (!pendingFlush) {
      pendingFlush = new Promise<void>((resolve) => {
        queueTask(() => {
          console.log('In queue task', decodeText(bufferedBytes))
          controller.enqueue(bufferedBytes)
          bufferedBytes = new Uint8Array()
          pendingFlush = null
          resolve()
        })
      })
    }
  }

  return new TransformStream({
    transform(chunk, controller) {
      console.log('🟢🟢🟢')
      const newBufferedBytes = new Uint8Array(
        bufferedBytes.length + chunk.byteLength
      )
      newBufferedBytes.set(bufferedBytes)
      newBufferedBytes.set(chunk, bufferedBytes.length)
      bufferedBytes = newBufferedBytes
      flushBuffer(controller)
    },

    flush() {
      if (pendingFlush) {
        return pendingFlush
      }

      return
    },
  })
}
