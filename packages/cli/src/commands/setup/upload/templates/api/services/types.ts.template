import type { GraphQLResolveInfo } from 'graphql'

import type { RedwoodGraphQLContext } from '@redwoodjs/graphql-server/dist/types'

export interface RedwoodUploadToken {
  __typename?: 'RedwoodUploadToken'
  token: string
}

export interface RTRedwoodUploadToken {
  __typename?: 'RedwoodUploadToken'
  token: string
}

export interface Query {
  __typename?: 'Query'
  getRedwoodUploadToken: RedwoodUploadToken
}

export interface GetRedwoodUploadTokenResolver {
  (
    args: { operationName: string },
    obj?: {
      root: Query

      context: RedwoodGraphQLContext
      info: GraphQLResolveInfo
    },
  ): Promise<RTRedwoodUploadToken>
}
