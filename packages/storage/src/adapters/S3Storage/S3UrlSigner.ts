import { UrlSigner } from '../../UrlSigner.js'

import type { S3Storage } from './S3Storage.js'
export type S3SignedUrlSettings = {
  storage: S3Storage
}

export class S3UrlSigner extends UrlSigner {
  private storage: S3Storage

  constructor(settings: S3SignedUrlSettings) {
    super({
      secret: '',
      endpoint: '',
    })
    this.storage = settings.storage
  }

  async generateSignedUrl(filePath: string, expiresIn?: number) {
    return this.storage.sign(filePath, expiresIn)
  }
}
