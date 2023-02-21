// From https://github.com/n1ru4l/envelop/blob/main/packages/plugins/response-cache/src/hash-sha256.ts

import { crypto, TextEncoder } from '@whatwg-node/fetch'

export const hashSHA256 = async (text: string): Promise<string> => {
  const inputUint8Array = new TextEncoder().encode(text)

  const arrayBuf = await crypto.subtle.digest(
    { name: 'SHA-256' },
    inputUint8Array
  )
  const outputUint8Array = new Uint8Array(arrayBuf)

  let hash = ''
  for (let i = 0, l = outputUint8Array.length; i < l; i++) {
    const hex = outputUint8Array[i].toString(16)
    hash += '00'.slice(0, Math.max(0, 2 - hex.length)) + hex
  }

  return hash
}
