import type { HttpOptions } from '@apollo/client'
import { ApolloLink, HttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { print } from 'graphql/language/printer'

export function createHttpLink(
  uri: string,
  httpLinkConfig: HttpOptions | undefined
) {
  return new HttpLink({
    // @MARK: we have to construct the absoltue url for SSR
    uri,
    ...httpLinkConfig,
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: { cache: 'no-store' },
  })
}
export function createUpdateDataLink(data: any) {
  return new ApolloLink((operation, forward) => {
    const { operationName, query, variables } = operation

    data.mostRecentRequest = {}
    data.mostRecentRequest.operationName = operationName
    data.mostRecentRequest.operationKind = query?.kind.toString()
    data.mostRecentRequest.variables = variables
    data.mostRecentRequest.query = query && print(operation.query)

    return forward(operation).map((result) => {
      data.mostRecentResponse = result

      return result
    })
  })
}
export function createAuthApolloLink(
  authProviderType: string,
  headers:
    | {
        'auth-provider'?: string | undefined
        authorization?: string | undefined
      }
    | undefined
) {
  return new ApolloLink((operation, forward) => {
    const { token } = operation.getContext()

    // Only add auth headers when there's a token. `token` is `null` when `!isAuthenticated`.
    const authHeaders = token
      ? {
          'auth-provider': authProviderType,
          authorization: `Bearer ${token}`,
        }
      : {}

    operation.setContext(() => ({
      headers: {
        ...operation.getContext().headers,
        ...headers,
        // Duped auth headers, because we may remove the `FetchConfigProvider` at a later date.
        ...authHeaders,
      },
    }))

    return forward(operation)
  })
}
export function createTokenLink(getToken: () => Promise<string | null>) {
  return setContext(async () => {
    const token = await getToken()

    return { token }
  })
}

export function createFinalLink({
  userConfiguredLink,
  defaultLinks,
}: {
  userConfiguredLink?: ApolloLink | RedwoodApolloLinkFactory
  defaultLinks: RedwoodApolloLinks
}): ApolloLink {
  if (userConfiguredLink) {
    if (typeof userConfiguredLink === 'function') {
      return userConfiguredLink(defaultLinks)
    } else {
      return userConfiguredLink
    }
  }

  return ApolloLink.from(defaultLinks.map((l) => l.link))
}

// ~~~ Types ~~~

export type RedwoodApolloLinkName =
  | 'withToken'
  | 'authMiddleware'
  | 'updateDataApolloLink'
  | 'httpLink'

export type RedwoodApolloLink<
  Name extends RedwoodApolloLinkName,
  Link extends ApolloLink = ApolloLink
> = {
  name: Name
  link: Link
}

export type RedwoodApolloLinks = [
  RedwoodApolloLink<'withToken'>,
  RedwoodApolloLink<'authMiddleware'>,
  RedwoodApolloLink<'updateDataApolloLink'>,
  RedwoodApolloLink<'httpLink', HttpLink>
]

export type RedwoodApolloLinkFactory = (links: RedwoodApolloLinks) => ApolloLink
