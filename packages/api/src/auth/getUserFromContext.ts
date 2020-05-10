import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  ClientContext,
} from 'aws-lambda'
import jwt from 'jsonwebtoken'

import { verifyAuth0Token } from './verifyAuth0Token'

export type SupportedAuthTypes = 'auth0' | 'netlify' | 'gotrue'

// This is shared by `@redwoodjs/web`
const REDWOOD_AUTH_TYPE_HEADER = 'x-redwood-auth-type'

type NewClientContext = ClientContext & {
  user?: object
}

export const getUserFromContext = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: LambdaContext
}) => {
  const type = event?.headers[REDWOOD_AUTH_TYPE_HEADER] as SupportedAuthTypes
  switch (type) {
    case 'gotrue':
    case 'netlify': {
      if (process.env.NODE_ENV === 'production') {
        const clientContext = context.clientContext as NewClientContext
        return clientContext?.user
      }
      // We're in development mode and we want to emulate Netlify's experience.
      // We decode the token, but don't verify it.
      const bearerToken = event.headers?.authorization.split(' ')[1]
      return jwt.decode(bearerToken)
    }
    case 'auth0': {
      const bearerToken = event.headers?.authorization.split(' ')[1]
      return await verifyAuth0Token(bearerToken)
    }
    default:
      return null
  }
}
