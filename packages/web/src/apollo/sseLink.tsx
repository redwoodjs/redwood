import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from '@apollo/client/core'
import { print } from 'graphql'
import { createClient, ClientOptions, Client } from 'graphql-sse'

export class SSELink extends ApolloLink {
  private client: Client

  constructor(options: ClientOptions) {
    super()
    this.client = createClient({
      ...options,
      singleConnection: undefined,
      onMessage: console.log,
    })
  }

  public request(operation: Operation): Observable<FetchResult> {
    console.debug('SSELink request', operation)
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
