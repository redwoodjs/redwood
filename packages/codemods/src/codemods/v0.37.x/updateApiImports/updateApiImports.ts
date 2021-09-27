import type { FileInfo, API } from 'jscodeshift'

const apiExports = [
  'DbAuthHandler',
  'dbAuthSession',
  'getAuthProviderHeader',
  'getAuthenticationContext',
  'parseAuthorizationHeader',
  'parseJWT',
  'prismaVersion',
  'redwoodVersion',
]

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift

  // Step 1: Find all named import statements from '@redwoodjs/api'

  // Step 2: For each import, check against apiExports whitelist
  // if in list: leave the import
  // if not: push import to array, remove the import and add import from gql server
}

// Edgecase: import context as baaaa from
