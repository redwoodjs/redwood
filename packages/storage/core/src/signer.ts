import crypto from 'node:crypto'

export interface StorageSignerPayload {
  adapter: string
  reference: string
  expiry: number
}

export abstract class StorageSigner {
  // TODO(jgmw): verify
  abstract encode(payload: StorageSignerPayload): string
  abstract decode(token: string): StorageSignerPayload | undefined
}

export class StorageSelfSigner extends StorageSigner {
  private readonly VERSION = 1
  private readonly secret: string

  constructor({ secret }: { secret: string }) {
    super()
    this.secret = secret
  }

  override encode(payload: StorageSignerPayload): string {
    const data = JSON.stringify({ ...payload, version: this.VERSION })
    const data64 = Buffer.from(data).toString('base64url')

    const hmac = crypto.createHmac('sha512', this.secret)
    hmac.update(data64)
    const signature = hmac.digest('base64url')

    return `${signature}.${data64}`
  }

  override decode(token: string): StorageSignerPayload | undefined {
    const [signature, ...data] = token.split('.')
    const data64 = data.join('.')

    const hmac = crypto.createHmac('sha512', this.secret)
    hmac.update(data64)
    const expectedSignature = hmac.digest('base64url')

    if (signature !== expectedSignature) {
      return undefined
    }

    const payload = JSON.parse(Buffer.from(data64, 'base64url').toString())
    return payload
  }
}
