/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BigIntResolver,
  DateResolver,
  TimeResolver,
  DateTimeResolver,
  JSONResolver,
  JSONObjectResolver,
} from 'graphql-scalars'
import gql from 'graphql-tag'

import type { GlobalContext } from '@redwoodjs/context'

// @TODO move prismaVersion & redwoodVersion to internal?
// We don't want a circular dependency here..
const { prismaVersion, redwoodVersion } = require('@redwoodjs/api')

/**
 * This adds scalar types for dealing with Date, Time, DateTime, and JSON.
 * This also adds a root Query type which is needed to start the GraphQL server on a fresh install.
 *
 * NOTE: When you add a new Scalar type you must add it to
 * "generateTypeDefGraphQL" in @redwoodjs/internal.
 */
export const schema = gql`
  scalar BigInt
  scalar Date
  scalar Time
  scalar DateTime
  scalar JSON
  scalar JSONObject

  """
  The RedwoodJS Root Schema

  Defines details about RedwoodJS such as the current user and version information.
  """
  type Redwood {
    "The version of Redwood."
    version: String
    "The current user."
    currentUser: JSON
    "The version of Prisma."
    prismaVersion: String
  }

  """
  About the Redwood queries.
  """
  type Query {
    "Fetches the Redwood root schema."
    redwood: Redwood
  }
`

export interface Resolvers {
  BigInt: typeof BigIntResolver
  Date: typeof DateResolver
  Time: typeof TimeResolver
  DateTime: typeof DateTimeResolver
  JSON: typeof JSONResolver
  JSONObject: typeof JSONObjectResolver
  Query: Record<string, unknown>
}

export const resolvers: Resolvers = {
  BigInt: BigIntResolver,
  Date: DateResolver,
  Time: TimeResolver,
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  JSONObject: JSONObjectResolver,
  Query: {
    redwood: () => ({
      version: redwoodVersion,
      prismaVersion: prismaVersion,
      currentUser: (_args: any, context: GlobalContext) => {
        return context?.currentUser
      },
    }),
  },
}
