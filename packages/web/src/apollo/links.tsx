import type { HttpOptions, Operation } from '@apollo/client'
import { ApolloLink, HttpLink, Observable } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { print } from 'graphql/language/printer'

export function createHttpLink(
  uri: string,
  httpLinkConfig: HttpOptions | undefined
) {
  return new HttpLink({
    uri,
    ...httpLinkConfig,
    // you can disable result caching here if you want to
    // @TODO: this is probably NextJS specific. Revisit once we have our own apollo package
    fetchOptions: { cache: 'no-store' },
  })
}

function enhanceError(operation: Operation, error: any) {
  const { operationName, query, variables } = operation

  error.__RedwoodEnhancedError = {
    operationName,
    operationKind: query?.kind.toString(),
    variables,
    query: query && print(query),
  }

  return error
}

export function createUpdateDataLink() {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      forward(operation).subscribe({
        next(result) {
          if (result.errors) {
            result.errors.forEach((error) => {
              enhanceError(operation, error)
            })
          }
          observer.next(result)
        },
        error(error: any) {
          observer.error(enhanceError(operation, error))
        },
        complete: observer.complete.bind(observer),
      })
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
  | 'enhanceErrorLink'
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
  RedwoodApolloLink<'enhanceErrorLink'>,
  RedwoodApolloLink<'httpLink', HttpLink>
]

export type RedwoodApolloLinkFactory = (links: RedwoodApolloLinks) => ApolloLink
