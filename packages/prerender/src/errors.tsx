import type { DocumentNode } from 'graphql'
import { print } from 'graphql'

export class PrerenderGqlError {
  message: string
  stack: string

  constructor(message: string) {
    this.message = 'GQL error: ' + message
    // The stacktrace would just point to this file, which isn't helpful,
    // because that's not where the error is. So we're just putting the
    // message there as well
    this.stack = this.message
  }
}

export class GqlHandlerImportError {
  message: string
  stack: string

  constructor(message: string) {
    this.message = 'Gql Handler Import Error:  ' + message
    // The stacktrace would just point to this file, which isn't helpful,
    // because that's not where the error is. So we're just putting the
    // message there as well
    this.stack = this.message
  }
}

interface JSONParseErrorArgs {
  query: DocumentNode
  variables?: Record<string, unknown>
  result: string
}

export class JSONParseError extends Error {
  constructor({ query, variables, result }: JSONParseErrorArgs) {
    const message =
      'Could not parse the GraphQL response.' +
      '\n  Request: ' +
      print(query).split('\n').join('\n  ') +
      '\n  Variables: ' +
      JSON.stringify(variables) +
      '\n  Response: ' +
      result

    super(message)
  }
}
