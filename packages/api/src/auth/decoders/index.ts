import type { GlobalContext } from 'src/globalContext'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { SupportedAuthTypes } from '@redwoodjs/auth'

import { netlify } from './netlify'
import { auth0 } from './auth0'
const noop = (token: string) => token

const typesToDecoders: Record<SupportedAuthTypes, Function> = {
  auth0: auth0,
  netlify: netlify,
  goTrue: netlify,
  magicLink: noop,
  firebase: noop,
  custom: noop,
}

export const decodeToken = async (
  type: SupportedAuthTypes,
  token: string,
  req: {
    event: APIGatewayProxyEvent
    context: GlobalContext & LambdaContext
  }
): Promise<null | string | object> => {
  if (!typesToDecoders[type]) {
    throw new Error(
      `The auth type "${type}" is not supported, we currently support: ${Object.keys(
        typesToDecoders
      ).join(', ')}`
    )
  }
  const decoder = typesToDecoders[type]
  return decoder(token, req)
}
