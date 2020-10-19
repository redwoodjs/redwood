type MetaDataBase = { roles?: string[]; authorization?: { roles?: string[] } }

function appMetadata(token: {
  decoded: { [index: string]: any }
  namespace?: string
}): MetaDataBase {
  const claim = token.namespace
    ? `${token.namespace}/app_metadata`
    : 'app_metadata'
  return token.decoded?.[claim] || {}
}

function roles(
  token: {
    decoded: { [index: string]: any }
  },
  metadata: MetaDataBase
): string[] {
  return (
    ((token.decoded?.roles as unknown) as string[]) ||
    metadata?.roles ||
    metadata.authorization?.roles ||
    []
  )
}

export function parseJWT(token: {
  decoded: { [index: string]: any }
  namespace?: string
}) {
  const appMetaData = appMetadata(token)
  return {
    appMetadata: appMetaData,
    roles: roles(token, appMetaData),
  }
}
