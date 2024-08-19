import crypto from 'node:crypto'

export const generateSignature = (filePath: string, expiresInMs?: number) => {
  if (!process.env.RW_UPLOADS_SECRET) {
    throw new Error(
      'Please configure RW_UPLOADS_SECRET in your environment variables',
    )
  }

  if (expiresInMs) {
    const expires = Date.now() + expiresInMs
    const signature = crypto
      .createHmac('sha256', process.env.RW_UPLOADS_SECRET)
      .update(`${filePath}:${expires}`)
      .digest('hex')

    return { expires, signature }
  } else {
    // Does not expire
    const signature = crypto
      .createHmac('sha256', process.env.RW_UPLOADS_SECRET)
      .update(filePath)
      .digest('hex')

    return {
      signature,
      expires: undefined,
    }
  }
}

/**
 * The signature and expires have to be extracted from the URL
 */
export const validateSignature = ({
  signature,
  filePath,
  expires,
}: {
  filePath: string
  signature: string
  expires?: number
}) => {
  // Note, expires not the same as expiresIn
  if (!process.env.RW_UPLOADS_SECRET) {
    throw new Error(
      'Please configure RW_UPLOADS_SECRET in your environment variables',
    )
  }

  if (expires) {
    // No need to validate if the signature has expired
    if (Date.now() > expires) {
      throw new Error('Signature has expired')
    }
  }

  const validSignature = expires
    ? crypto
        .createHmac('sha256', process.env.RW_UPLOADS_SECRET)
        .update(`${filePath}:${expires}`)
        .digest('hex')
    : crypto
        .createHmac('sha256', process.env.RW_UPLOADS_SECRET)
        .update(`${filePath}`)
        .digest('hex')

  if (validSignature !== signature) {
    throw new Error('Invalid signature')
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

type SigningParms = { filePath: string; expiresIn?: number }

export const generateSignedQueryParams = (
  endpoint: string,
  { filePath, expiresIn }: SigningParms,
) => {
  const { signature, expires } = generateSignature(filePath, expiresIn)

  // This way you can pass in a path with params already
  const params = new URLSearchParams()
  params.set('s', signature)
  if (expires) {
    params.set('expires', expires.toString())
  }

  params.set('path', filePath)

  return `${endpoint}?${params.toString()}`
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
