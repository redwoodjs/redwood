import {
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import mime from 'mime-types'

import type { SaveOptionsOverride } from '../BaseStorageAdapter.js'
import { BaseStorageAdapter } from '../BaseStorageAdapter.js'

export type S3StorageOptions = {
  // The base directory within the S3 bucket where files will be stored
  baseDir: string
  // The name of the S3 bucket to use for storage
  bucket: string
  // The AWS region where the S3 bucket is located
  region: string
  // The public part of your AWS access key pair, used to identify your AWS account or IAM user
  accessKeyId: string
  // The private part of your AWS access key pair, used to sign AWS API requests (keep this secret!)
  secretAccessKey: string
  // Optional: Custom endpoint URL for S3-compatible storage services (e.g., Fly/Tigris or MinIO)
  endpoint?: string
  // Optional: Number of concurrent uploads
  queueSize?: number
  // Optional: Log progress of the upload
  showProgress?: boolean
}

export class S3Storage
  extends BaseStorageAdapter
  implements BaseStorageAdapter
{
  private s3Client: S3Client
  private bucket: string
  private queueSize?: number
  private showProgress?: boolean

  constructor(opts: S3StorageOptions) {
    super(opts)
    this.s3Client = new S3Client({
      region: opts.region,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
      endpoint: opts.endpoint,
      forcePathStyle: !!opts.endpoint,
    })
    this.bucket = opts.bucket
    this.queueSize = opts.queueSize || 3
    this.showProgress = opts.showProgress || false
  }

  async save(file: File, saveOverride?: SaveOptionsOverride) {
    const fileName = this.generateFileNameWithExtension(saveOverride, file)
    const key = `${saveOverride?.path || this.adapterOpts.baseDir}/${fileName}`

    const upload = new Upload({
      params: {
        ContentType: file.type,
        CacheControl: 'max-age=31536000',
        Bucket: this.bucket,
        Key: key,
        Body: file,
      },
      client: this.s3Client,
      queueSize: this.queueSize,
    })

    if (this.showProgress) {
      upload.on('httpUploadProgress', (progress) => {
        console.log(progress)
      })
    }

    const result = await upload.done()

    return { location: key, ...result }
  }

  async read(fileLocation: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileLocation,
    })

    const response = await this.s3Client.send(command)
    const contents = await response.Body?.transformToByteArray()

    return {
      contents: Buffer.from(contents || []),
      type: mime.lookup(fileLocation),
    }
  }

  async remove(fileLocation: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileLocation,
    })

    await this.s3Client.send(command)
  }

  async sign(fileLocation: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileLocation,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn })
  }
}

export { S3UrlSigner } from './S3UrlSigner.js'
