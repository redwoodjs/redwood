import crypto from 'node:crypto'

import { getConfig } from '@redwoodjs/project-config'

export type SignedUrlSettings = {
  endpoint: string // The path to the signed url endpoint, or a full url (include http(s)://)
  secret: string // The secret to sign the urls with
}

export class UrlSigner {
  private secret: string
  private endpoint: string

  constructor({ secret, endpoint }: SignedUrlSettings) {
    this.secret = secret
    this.endpoint = endpoint

    this.endpoint = endpoint.startsWith('http')
      ? endpoint
      : `${getConfig().web.apiUrl}${endpoint}`
  }

  generateSignature({
    filePath,
    expiresInMs,
  }: {
    filePath: string
    expiresInMs?: number
  }) {
    if (!this.secret) {
      throw new Error('Please configure the secret')
    }

    if (expiresInMs) {
      const expiry = Date.now() + expiresInMs
      const signature = crypto
        .createHmac('sha256', this.secret)
        .update(`${filePath}:${expiry}`)
        .digest('hex')

      return { expiry, signature }
    } else {
      // Does not expire
      const signature = crypto
        .createHmac('sha256', this.secret)
        .update(filePath)
        .digest('hex')

      return {
        signature,
        expiry: undefined,
      }
    }
  }

  /**
   * The signature and expires have to be extracted from the URL
   */
  validateSignature({
    signature,
    filePath,
    expiry,
  }: {
    filePath: string
    signature: string
    expiry?: number
  }) {
    if (!this.secret) {
      throw new Error('Please configure the secret')
    }

    if (expiry) {
      // No need to validate if the signature has expired
      if (Date.now() > expiry) {
        throw new Error('Signature has expired')
      }
    }

    const validSignature = expiry
      ? crypto
          .createHmac('sha256', this.secret)
          .update(`${filePath}:${expiry}`)
          .digest('hex')
      : crypto
          .createHmac('sha256', this.secret)
          .update(`${filePath}`)
          .digest('hex')

    if (validSignature !== signature) {
      throw new Error('Invalid signature')
    }
  }

  generateSignedUrl(filePath: string, expiresIn?: number) {
    const { signature, expiry: expires } = this.generateSignature({
      filePath,
      expiresInMs: expiresIn,
    })

    // This way you can pass in a path with params already
    const params = new URLSearchParams()
    params.set('s', signature)
    if (expires) {
      params.set('expires', expires.toString())
    }

    params.set('path', filePath)

    return `${this.endpoint}?${params.toString()}`
  }
}

export const getSignedDetailsFromUrl = (url: string) => {
  const urlObj = new URL(url)
  const expires = urlObj.searchParams.get('expires')
  return {
    expires: expires ? parseInt(expires) : undefined,
    file: urlObj.searchParams.get('file'),
    signature: urlObj.searchParams.get('s'),
  }
}

export const EXPIRES_IN = {
  seconds: (s: number) => s * 1000,
  minutes: (m: number) => m * 60 * 1000,
  hours: (h: number) => h * 60 * 60 * 1000,
  days: (d: number) => d * 24 * 60 * 60 * 1000,
  weeks: (w: number) => w * 7 * 24 * 60 * 60 * 1000,
  months: (m: number) => m * 30 * 24 * 60 * 60 * 1000,
  years: (y: number) => y * 365 * 24 * 60 * 60 * 1000,
}
