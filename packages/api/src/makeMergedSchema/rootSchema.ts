/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { GlobalContext } from 'src/globalContext'
import { PrismaClient } from '@prisma/client'
import gql from 'graphql-tag'
import {
  DateResolver,
  TimeResolver,
  DateTimeResolver,
  JSONResolver,
  JSONObjectResolver,
} from 'graphql-scalars'

// @ts-ignore - not inside the <rootDir>
import apiPackageJson from 'src/../package.json'

/**
 * This adds scalar types for dealing with Date, Time, DateTime, and JSON.
 * This also adds a root Query type which is needed to start the GraphQL server on a fresh install.
 */
export const schema = gql`
  scalar Date
  scalar Time
  scalar DateTime
  scalar JSON
  scalar JSONObject

  type Redwood {
    version: String
    currentUser: JSON
    prismaVersion: String
  }

  type Query {
    redwood: Redwood
  }
`

export interface Resolvers {
  Date: typeof DateResolver
  Time: typeof TimeResolver
  DateTime: typeof DateTimeResolver
  JSON: typeof JSONResolver
  JSONObject: typeof JSONObjectResolver
  Query: Record<string, unknown>
}

export const resolvers: Resolvers = {
  Date: DateResolver,
  Time: TimeResolver,
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  JSONObject: JSONObjectResolver,
  Query: {
    redwood: () => ({
      version: apiPackageJson.version,
      prismaVersion: PrismaClient.prismaVersion.client,
      currentUser: (_args: any, context: GlobalContext) => {
        return context?.currentUser
      },
    }),
  },
}
