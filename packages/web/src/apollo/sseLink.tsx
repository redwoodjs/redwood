import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from '@apollo/client/core'
import { print } from 'graphql'
import { createClient, ClientOptions, Client } from 'graphql-sse'
interface SSELinkOptions extends Partial<ClientOptions> {
  url: string
  authProviderType: string
  tokenFn: Promise<null | string>
  httpLinkCredentials?: string | undefined
  headers?: Record<string, string>
}

const mapCredentialsHeader = (
  httpLinkCredentials?: string
): 'omit' | 'same-origin' | 'include' | undefined => {
  if (!httpLinkCredentials) {
    return undefined
  }
  switch (httpLinkCredentials) {
    case 'omit':
    case 'same-origin':
    case 'include':
      return httpLinkCredentials
    default:
      return undefined
  }
}

const mapReferrerPolicyHeader = (
  referrerPolicy?: string
):
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'same-origin'
  | 'origin'
  | 'strict-origin'
  | 'origin-when-cross-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url'
  | undefined => {
  if (!referrerPolicy) {
    return undefined
  }
  switch (referrerPolicy) {
    case 'no-referrer':
    case 'no-referrer-when-downgrade':
    case 'same-origin':
    case 'origin':
    case 'strict-origin':
    case 'origin-when-cross-origin':
    case 'strict-origin-when-cross-origin':
    case 'unsafe-url':
      return referrerPolicy
    default:
      return undefined
  }
}

/**
 * GraphQL over Server-Sent Events (SSE) spec link for Apollo Client
 */
export class SSELink extends ApolloLink {
  private client: Client

  constructor(options: SSELinkOptions) {
    super()

    this.client = createClient({
      url: options.url,
      headers: async () => {
        const token = await options.tokenFn

        // Only add auth headers when there's a token. `token` is `null` when `!isAuthenticated`.
        if (!token) {
          return { ...options.headers }
        }
        return {
          Authorization: `Bearer ${token}`,
          'auth-provider': options.authProviderType,
          ...options.headers,
        }
      },
      credentials: mapCredentialsHeader(options.httpLinkCredentials),
      referrer: options.headers?.referrer,
      referrerPolicy: mapReferrerPolicyHeader(options.headers?.referrerPolicy),
    })
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        }
      )
    })
  }
}
