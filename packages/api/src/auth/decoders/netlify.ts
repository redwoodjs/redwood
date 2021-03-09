import type { Context as LambdaContext, ClientContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'

type NetlifyContext = ClientContext & {
  user?: Record<string, unknown>
}

export const netlify = (token: string, req: { context: LambdaContext }) => {
  // Netlify verifies and decodes the JWT before the request is passed to our
  // Serverless function, so the decoded JWT is already available in production.
  // For development and test we can't verify the token because we don't have
  // the signing key. Just decoding the token is the best we can do to emulate
  // the native Netlify experience
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    return jwt.decode(token)
  } else {
    const clientContext = req.context.clientContext as NetlifyContext
    return clientContext?.user || null
  }
}
