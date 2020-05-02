import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import fetch from 'node-fetch'

export type SupportedAuthTypes = 'auth0' | 'netlify'

type NetlifyClientContext = Context & {
  clientContext: {
    user?: any
  }
}

// TODO: Define what an Auth0 user looks like.
const REDWOOD_AUTH_TYPE_HEADER = 'x-redwood-auth-type'

export const getUserFromContext = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: NetlifyClientContext
}) => {
  const type = event?.headers[REDWOOD_AUTH_TYPE_HEADER] as SupportedAuthTypes
  switch (type) {
    case 'netlify':
      return context.clientContext?.user
    case 'auth0': {
      // We need a strategy for fetching, caching and invalidating users from Auth0.
      // It would be amazing if Netlify could do this automatically for us:
      // As an example if we passed in an `X-Redwood-Auth-Type: Auth0` header,
      // and it fetch this and placed it in `clientContext.user`,
      // just like Netlify identity does it.
      const response = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        {
          headers: {
            Authorization: event.headers?.authorization,
          },
        }
      )
      return response.json()
    }
    default:
      return undefined
  }
}
