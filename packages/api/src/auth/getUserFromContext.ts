import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { verifyAuth0Token } from './verifyAuth0Token'

export type SupportedAuthTypes = 'auth0' | 'netlify'

type ClientContext = Context & {
  clientContext: {
    user?: any
  }
}

// This is shared by `@redwoodjs/web`
const REDWOOD_AUTH_TYPE_HEADER = 'x-redwood-auth-type'

export const getUserFromContext = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: ClientContext
}) => {
  const type = event?.headers[REDWOOD_AUTH_TYPE_HEADER] as SupportedAuthTypes
  switch (type) {
    case 'netlify':
      return context.clientContext?.user
    case 'auth0': {
      // Example: Bearer o2LBTnXUiHEiSD5AR6rfKEY7T7ODcPJW
      const bearerToken = event.headers?.authorization.split(' ')[1]
      return await verifyAuth0Token(bearerToken)
    }
    default:
      return undefined
  }
}
