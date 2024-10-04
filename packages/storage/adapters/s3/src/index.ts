import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import type { PutObjectCommandInput } from '@aws-sdk/client-s3'
import type { Configuration } from '@aws-sdk/lib-storage'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import mimeTypes from 'mime-types'
import { v7 as uuidv7 } from 'uuid'

import { StorageAdapter } from '@redwoodjs/storage-core'

export interface S3AdapterConfig {
  bucket: string
  region: string
  endpoint?: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  queueSize?: number
  partSize?: number
}

export type S3WriteOptions = {
  tags?: Configuration['tags']
} & Omit<
  PutObjectCommandInput,
  'Bucket' | 'Key' | 'Body' | 'Tags' | 'ContentType'
>

export class S3Adapter extends StorageAdapter {
  private name: string
  public config: S3AdapterConfig
  private s3Client: S3Client
  private queueSize: number
  private partSize: number

  constructor(config: S3AdapterConfig) {
    super()
    this.name = Date.now().toString()
    this.config = config
    this.s3Client = new S3Client({
      region: config.region,
      credentials: config.credentials,
      ...(config.endpoint && { endpoint: config.endpoint }),
    })
    this.queueSize = config.queueSize || 4
    this.partSize = config.partSize || 5 * 1024 * 1024
  }

  getName(): string {
    return this.name
  }

  setName(name: string): void {
    this.name = name
  }

  override async readData(reference: string) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: reference,
    })
    const response = await this.s3Client.send(command)
    return Buffer.from(await response.Body!.transformToByteArray())
  }

  override async readFile(enrichedReference: string) {
    const { mimeType } = this.parseEnrichedReference(enrichedReference)
    const data = await this.readData(enrichedReference)
    const response = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: enrichedReference,
      }),
    )

    // don't I want all the s3 response data here? like typ, etag, etc?`
    return new File([data], enrichedReference, {
      type: mimeType,
      lastModified: response.LastModified?.getTime(),
    })
  }

  override async readStream<TStreamType>(reference: string) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: reference,
    })
    const response = await this.s3Client.send(command)
    return response.Body as ReadableStream<TStreamType>
  }

  override async writeData(data: Buffer, options?: S3WriteOptions) {
    const reference = this.generateReference()
    const upload = new Upload({
      params: {
        Bucket: this.config.bucket,
        Key: reference,
        Body: data,
        ...Object.fromEntries(
          Object.entries(options || {}).filter(([key]) => key !== 'tags'),
        ),
      },
      client: this.s3Client,
      queueSize: this.queueSize,
      partSize: this.partSize,
      tags: options?.tags,
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    await upload.done()

    return reference
  }

  override async writeFile(data: File, options?: S3WriteOptions) {
    const reference = this.generateReference()
    const enrichedReference = this.enrichReference(reference, data.type)

    const upload = new Upload({
      params: {
        Bucket: this.config.bucket,
        Key: enrichedReference,
        Body: data,
        ContentType: data.type,
        ...Object.fromEntries(
          Object.entries(options || {}).filter(([key]) => key !== 'tags'),
        ),
      },
      client: this.s3Client,
      queueSize: this.queueSize,
      partSize: this.partSize,
      tags: options?.tags,
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    await upload.done()

    return enrichedReference
  }

  // do I really read/write need data and stream?
  override async writeStream<TStreamType>(
    data: ReadableStream<TStreamType>,
    options?: S3WriteOptions,
  ) {
    const reference = this.generateReference()

    const upload = new Upload({
      params: {
        Bucket: this.config.bucket,
        Key: reference,
        Body: data,

        ...Object.fromEntries(
          Object.entries(options || {}).filter(([key]) => key !== 'tags'),
        ),
      },
      client: this.s3Client,
      queueSize: this.queueSize,
      partSize: this.partSize,
      tags: options?.tags,
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    await upload.done()

    return reference
  }

  override async delete(reference: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: reference,
      }),
    )
  }

  override async exists(reference: string) {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: reference,
        }),
      )
      return true
    } catch {
      return false
    }
  }

  override async getSignedUrl(reference: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: reference,
    })
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
  }

  // Helper methods (similar to FileSystemAdapter)
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

  async listBuckets() {
    return this.s3Client.send(new ListBucketsCommand({}))
  }

  async listObjects(bucket: string) {
    return this.s3Client.send(new ListObjectsV2Command({ Bucket: bucket }))
  }
}
