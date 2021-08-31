// based on ApolloError https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-errors/src/index.ts
import { EnvelopError } from '@envelop/core'

export class RedwoodGraphQLError extends EnvelopError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, extensions)
  }
}

export class SyntaxError extends RedwoodGraphQLError {
  constructor(message: string) {
    super(message, { code: 'GRAPHQL_PARSE_FAILED' })
  }
}

export class ValidationError extends RedwoodGraphQLError {
  constructor(message: string) {
    super(message, { code: 'GRAPHQL_VALIDATION_FAILED' })
  }
}

export class AuthenticationError extends RedwoodGraphQLError {
  constructor(message: string) {
    super(message, { code: 'UNAUTHENTICATED' })
  }
}

export class ForbiddenError extends RedwoodGraphQLError {
  constructor(message: string) {
    super(message, { code: 'FORBIDDEN' })
  }
}

export class PersistedQueryNotFoundError extends RedwoodGraphQLError {
  constructor() {
    super('PersistedQueryNotFound', { code: 'PERSISTED_QUERY_NOT_FOUND' })
  }
}

export class PersistedQueryNotSupportedError extends RedwoodGraphQLError {
  constructor() {
    super('PersistedQueryNotSupported', {
      code: 'PERSISTED_QUERY_NOT_SUPPORTED',
    })
  }
}

export class UserInputError extends RedwoodGraphQLError {
  constructor(message: string, properties?: Record<string, any>) {
    super(message, { code: 'BAD_USER_INPUT', properties })
  }
}
