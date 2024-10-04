import { LRUCache } from 'lru-cache'
import mimeTypes from 'mime-types'
import { v7 as uuidv7 } from 'uuid'

import type { StorageSigner } from '@redwoodjs/storage-core'
import { StorageAdapter } from '@redwoodjs/storage-core'

export interface MemoryAdapterConfig {
  maxSize?: number // Maximum number of items to store
  maxAge?: number // Maximum age of items in milliseconds
  signing: {
    signer: StorageSigner
    baseUrl: string
  }
}

interface StoredItem {
  data: Buffer
  mimeType: string
  lastModified: number
}

export class MemoryAdapter extends StorageAdapter {
  private name: string
  public config: MemoryAdapterConfig
  private storage: LRUCache<string, StoredItem>

  constructor(config: MemoryAdapterConfig) {
    super()
    this.name = Date.now().toString()
    this.config = config
    this.storage = new LRUCache({
      max: config.maxSize || 1000,
      ttl: config.maxAge,
      allowStale: false,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    })
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  override async readData(reference: string) {
    const item = this.storage.get(reference)
    if (!item) {
      throw new Error(`Item not found: ${reference}`)
    }
    return item.data
  }

  override async readFile(enrichedReference: string) {
    const { reference, mimeType } =
      this.parseEnrichedReference(enrichedReference)
    const item = this.storage.get(reference)
    console.debug('item', item)
    console.debug('reference', reference)
    console.debug('mimeType', mimeType)
    console.debug('enrichedReference', enrichedReference)
    if (!item) {
      throw new Error(`Item not found: ${reference}`)
    }

    return new File([item.data], enrichedReference, {
      type: mimeType,
      lastModified: item.lastModified,
    })
  }

  override async readStream<TStreamType>(reference: string) {
    const item = this.storage.get(reference)
    if (!item) {
      throw new Error(`Item not found: ${reference}`)
    }

    return new ReadableStream<TStreamType>({
      start(controller) {
        controller.enqueue(item.data as TStreamType)
        controller.close()
      },
    })
  }

  override async writeData(data: Buffer) {
    const reference = this.generateReference()
    this.storage.set(reference, {
      data,
      mimeType: 'application/octet-stream',
      lastModified: Date.now(),
    })
    return reference
  }

  override async writeFile(data: File) {
    const reference = this.generateReference()
    const buffer = Buffer.from(await data.arrayBuffer())
    const item = this.storage.set(reference, {
      data: buffer,
      mimeType: data.type,
      lastModified: data.lastModified,
    })
    console.debug('item', item)
    const enrichedReference = this.enrichReference(reference, data.type)
    console.debug('enrichedReference', enrichedReference)
    return enrichedReference
  }

  override async writeStream<TStreamType>(data: ReadableStream<TStreamType>) {
    const reference = this.generateReference()
    let isReading = true
    const chunks: Buffer[] = [] // Define chunks array
    while (isReading) {
      const { done, value } = await data.getReader().read()
      if (done) {
        isReading = false
      }
      chunks.push(value as Buffer)
    }

    const buffer = Buffer.concat(chunks)
    this.storage.set(reference, {
      data: buffer,
      mimeType: 'application/octet-stream',
      lastModified: Date.now(),
    })
    return reference
  }

  override async delete(reference: string) {
    this.storage.delete(reference)
  }

  override async exists(reference: string) {
    return this.storage.has(reference)
  }

  override async getSignedUrl(reference: string): Promise<string> {
    const token = this.config.signing.signer.encode({
      adapter: this.name,
      reference, /// but what is saved with enriched extension
      expiry: 0,
    })

    const base = new URL(this.config.signing.baseUrl)
    base.searchParams.set('token', token)
    return base.toString()
  }

  // ---

  private generateReference() {
    return uuidv7()
  }

  private enrichReference(reference: string, mimeType: string): string {
    const ext = mimeTypes.extension(mimeType) || mimeType.replaceAll('/', '_')
    return `${reference}.${ext}`
  }

  private parseEnrichedReference(enrichedReference: string): {
    reference: string
    mimeType: string
  } {
    const parts = enrichedReference.split('.')
    const reference = parts.slice(0, -1).join('.')

    const ext = parts[parts.length - 1]
    const mimeType = mimeTypes.lookup(ext) || ext.replaceAll('_', '/')

    return { reference, mimeType }
  }
}
