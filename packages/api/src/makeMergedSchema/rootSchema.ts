import gql from 'graphql-tag'
import {
  DateResolver,
  TimeResolver,
  DateTimeResolver,
  JSONResolver,
  JSONObjectResolver,
} from 'graphql-scalars'

import type { GlobalContext } from '../globalContext'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import apiPackageJson from '../../package.json'

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
      currentUser: (_args: unknown, context: GlobalContext) => {
        return context?.currentUser
      },
    }),
  },
}
