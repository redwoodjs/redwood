interface DecodedToken {
  decoded: object
  namespace?: string
}

const appMetadata = (token: DecodedToken): { appMetadata: object } => {
  const claim = token.namespace
    ? `${token.namespace}/app_metadata`
    : 'app_metadata'
  return token.decoded?.[claim] || {}
}

const roles = (token: DecodedToken): { roles: string[] } => {
  console.log(token)
  const metadata = appMetadata(token)
  return (
    token.decoded?.roles ||
    metadata?.roles ||
    metadata.authorization?.roles ||
    []
  )
}

export const parseJWT = (
  token: DecodedToken
): { appMetadata: object; roles: string[] } => {
  return {
    appMetadata: appMetadata(token),
    roles: roles(token),
  }
}
