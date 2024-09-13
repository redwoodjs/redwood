import type { Tag } from '@aws-sdk/client-s3'
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
  // Optional: Cache control header value. Defaults to 1 week.
  cacheControl?: string
  // Optional: Tags to apply to the object
  tags?: Tag[]
  /**
   * OptionThe size of the concurrent queue manager to upload parts in parallel. Set to 1 for synchronous uploading of parts. Note that the uploader will buffer at most queueSize * partSize bytes into memory at any given time.
   * default: 4
   */
  queueSize?: number
  /**
   * Optional: The size in bytes for each individual part to be uploaded. Adjust the part size to ensure the number of parts does not exceed maxTotalParts.
   * See 5mb is the minimum allowed part size.
   */
  partSize?: number
  // Optional: Log progress of the upload
  showProgress?: boolean
}
export class S3Storage
  extends BaseStorageAdapter
  implements BaseStorageAdapter
{
  private s3Client: S3Client
  private bucket: string
  // Defaults to 1 week
  private cacheControl?: string
  private showProgress?: boolean
  private queueSize?: number
  private partSize?: number
  /**
   * The tags to apply to the object.
   */
  private tags: Tag[]

  constructor(opts: S3StorageOptions) {
    super(opts)

    const { queueSize, partSize, tags } = opts

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
    this.cacheControl = opts.cacheControl
    this.tags = tags || []
    this.queueSize = queueSize
    this.partSize = partSize
    this.tags = opts.tags || []
    this.showProgress = opts.showProgress || false
  }

  /**
   * Saves a file to the S3 storage.
   *
   * The key is the path to the file in the S3 bucket and is constructed from
   * the baseDir, the file name, and the path override.
   *
   * Use the `saveOverride` parameter to specify a path override to organize
   * your files in a specific folder in the bucket.
   *
   * Default params:
   * - ContentType: The MIME type of the file.
   * - CacheControl: 'max-age=604800' // 1 week
   *
   * @param file - The file to save.
   * @param saveOverride - Optional overrides for the save operation.
   * @returns The location of the saved file.
   */
  async save(file: File, saveOverride?: SaveOptionsOverride) {
    const fileName = this.generateFileNameWithExtension(saveOverride, file)
    const key = `${saveOverride?.path || this.adapterOpts.baseDir}/${fileName}`

    const upload = new Upload({
      params: {
        ContentType: file.type,
        CacheControl: this.cacheControl || 'max-age=604800',
        Bucket: this.bucket,
        Key: key,
        Body: file,
      },
      client: this.s3Client,
      queueSize: this.queueSize,
      partSize: this.partSize,
      tags: this.tags,
    })

    if (this.showProgress) {
      upload.on('httpUploadProgress', (progress) => {
        console.log(progress)
      })
    }

    const result = await upload.done()
    // The result looks like:
    //    {
    //  '$metadata': {
    //    httpStatusCode: 200,
    //    requestId: '992625086802962799',
    //      extendedRequestId: undefined,
    //        cfId: undefined,
    //      attempts: 1,
    //      totalRetryDelay: 0
    //   },
    //   ETag: '"a17fabeb1fcf56b1022a8d236374066e"',
    //   Bucket: 'bucket',
    //   Key: 'baseDir/path/fileName.png',
    //   Location: 'https://fly.storage.tigris.dev/rw-showcases/baseDir/path/fileName.png'
    // }
    // We save key because that what the S3UrlSigner and the S3 client expects when signing or reading
    // The result location is the url in S3 but for private buckets you cannot access that without the signed url
    // So, therefore we save the key and return that as the location
    return { location: result.Key || key, ...result }
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
