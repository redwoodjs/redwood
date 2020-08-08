interface DecodedToken {
  decoded: object
  namespace?: string
}

interface AppMetadata {
  roles?: string[]
  authorization?: string
}

interface ParsedJWT {
  appMetadata: AppMetadata
  roles: string[]
}

const appMetadata = (token: DecodedToken): { appMetadata: AppMetadata } => {
  const claim = token.namespace
    ? `${token.namespace}/app_metadata`
    : 'app_metadata'
  return token.decoded?.[claim] || {}
}

const roles = (token: DecodedToken): { roles?: string[] } => {
  const metadata = appMetadata(token)
  return (
    token.decoded?.roles ||
    metadata?.roles ||
    metadata.authorization?.roles ||
    []
  )
}

export const parseJWT = (token: DecodedToken): { ParsedJWT } => {
  return {
    appMetadata: appMetadata(token),
    roles: roles(token),
  }
}
