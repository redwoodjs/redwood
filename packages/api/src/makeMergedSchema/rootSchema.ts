import type { Context } from 'src/globalContext'

import gql from 'graphql-tag'
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date'
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'

// @ts-ignore
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
  }

  type Query {
    redwood: Redwood
  }
`

export const resolvers = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    redwood: () => ({
      version: apiPackageJson.version,
      currentUser: (_args: any, context: Context) => {
        return context?.currentUser
      }
    }),
  },
}
