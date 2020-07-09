import type { Context as LambdaContext, ClientContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'

type NetlifyContext = ClientContext & {
  user?: object
}

export const netlify = (token: string, req: { context: LambdaContext }) => {
  // Netlify verifies and decodes the JWT before the request is passed to our Serverless
  // function, so the decoded JWT is already available in production.
  if (process.env.NODE_ENV === 'production') {
    const clientContext = req.context.clientContext as NetlifyContext
    return clientContext?.user || null
  } else {
    // We emulate the native Netlify experience in development mode.
    // We just decode it since we don't have the signing key.
    return jwt.decode(token)
  }
}
