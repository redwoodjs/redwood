import crypto from 'node:crypto'
export const generateSignature = (filePath: string, expiresIn: number) => {
  if (!process.env.RW_UPLOADS_SECRET) {
    throw new Error(
      'Please configure RW_UPLOADS_SECRET in your environment variables',
    )
  }

  const expires = Math.floor(Date.now() / 1000) + expiresIn
  const signature = crypto
    .createHmac('sha256', process.env.RW_UPLOADS_SECRET)
    .update(`${filePath}:${expires}`)
    .digest('hex')

  return signature
}
