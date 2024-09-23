import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import stream from 'node:stream'

import mimeTypes from 'mime-types'
import { v7 as uuidv7 } from 'uuid'

import type { StorageSigner } from '@redwoodjs/storage-core'
import { StorageAdapter } from '@redwoodjs/storage-core'

export interface FileSystemAdapterConfig {
  root: string
  signing: {
    signer: StorageSigner
    baseUrl: string
  }
}

export class FileSystemAdapter extends StorageAdapter {
  private name: string
  public config: FileSystemAdapterConfig

  constructor(config: FileSystemAdapterConfig) {
    super()
    this.name = Date.now().toString()
    this.config = config
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  override async readData(reference: string) {
    const filepath = this.referenceToPath(reference)
    return fs.readFile(filepath, { flag: 'r' })
  }

  override async readFile(enrichedReference: string) {
    const { mimeType } = this.parseEnrichedReference(enrichedReference)
    const filepath = this.referenceToPath(enrichedReference)

    const buffer = await fs.readFile(filepath, { flag: 'r' })
    const lastModified = (await fs.stat(filepath)).mtimeMs

    return new File([buffer], enrichedReference, {
      type: mimeType,
      lastModified,
    })
  }

  override async readStream<TStreamType>(reference: string) {
    const filepath = this.referenceToPath(reference)
    const nodeStream = fsSync.createReadStream(filepath)
    const webStream = stream.Readable.toWeb(nodeStream)

    // toWeb doesn't appear to take a generic type, so we need to cast it here
    return webStream as ReadableStream<TStreamType>
  }

  override async writeData(data: Buffer) {
    const reference = this.generateReference()
    const filepath = this.referenceToPath(reference)

    await fs.mkdir(path.dirname(filepath), { recursive: true })
    await fs.writeFile(filepath, data, { flag: 'w' })

    return reference
  }

  override async writeFile(data: File) {
    const reference = this.generateReference()
    const enrichedReference = this.enrichReference(reference, data.type)
    const filepath = this.referenceToPath(enrichedReference)

    const buffer = Buffer.from(await data.arrayBuffer())
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    await fs.writeFile(filepath, buffer, { flag: 'w' })

    return enrichedReference
  }

  override async writeStream<TStreamType>(data: ReadableStream<TStreamType>) {
    const reference = this.generateReference()
    const filepath = this.referenceToPath(reference)
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    const writeStream = fsSync.createWriteStream(filepath)
    const webStream = stream.Writable.toWeb(writeStream)

    await data.pipeTo(webStream)

    return reference
  }

  override async delete(reference: string) {
    const filepath = this.referenceToPath(reference)
    return fs.unlink(filepath)
  }

  override async exists(reference: string) {
    const filepath = this.referenceToPath(reference)
    try {
      fs.stat(filepath)
      return true
    } catch {
      return false
    }
  }

  override async getSignedUrl(reference: string): Promise<string> {
    const token = this.config.signing.signer.encode({
      adapter: this.name,
      reference,
      expiry: 0,
    })

    const base = new URL(this.config.signing.baseUrl)
    base.searchParams.set('token', token)
    return base.toString()
  }

  // ---

  private referenceToPath(reference: string) {
    // TODO(jgmw): Store metadata in a .json file with the same ref
    return path.join(this.config.root, reference)
  }

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
