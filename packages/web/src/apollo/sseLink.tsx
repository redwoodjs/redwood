import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from '@apollo/client/core'
import { print } from 'graphql'
import { createClient, ClientOptions, Client } from 'graphql-sse'

/**
 * GraphQL over Server-Sent Events (SSE) spec link for Apollo Client
 */
export class SSELink extends ApolloLink {
  private client: Client

  constructor(
    options: ClientOptions,
    authProviderType: string,
    tokenFn: Promise<null | string>
  ) {
    console.info('>>>>> SSELink options')

    super()

    this.client = createClient({
      url: options.url,
      headers: async () =>
        Promise.resolve({
          Authorization: `Bearer ${await tokenFn.then((token) => token)}`,
          'auth-provider': authProviderType,
          ...options.headers,
        }),
      retryAttempts: 0,
      credentials: 'include',
    })
  }

  public request(operation: Operation): Observable<FetchResult> {
    console.info('>>>>> SSELink operation')

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
