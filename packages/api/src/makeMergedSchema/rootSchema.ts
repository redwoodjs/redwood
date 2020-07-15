import type { GlobalContext } from 'src/globalContext'
import gql from 'graphql-tag'
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date'
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json'


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
  }

  type Query {
    redwood: Redwood
  }
`

export interface Resolvers {
  Date: typeof GraphQLDate
  Time: typeof GraphQLTime
  DateTime: typeof GraphQLDateTime
  JSON: typeof GraphQLJSON
  JSONObject: typeof GraphQLJSONObject
  Query: {}
}

export const resolvers: Resolvers = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    redwood: () => ({
      version: apiPackageJson.version,
      currentUser: (_args: any, context: GlobalContext) => {
        return context?.currentUser
      },
    }),
  },
}
