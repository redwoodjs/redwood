import { gql } from 'apollo-server-lambda'
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date'

/**
 * Adds scalar types for dealing with Date, Time, and DateTime.
 * Adds a root Query Type which is need to start the GraphQL server on a fresh launch.
 */
export const schema = gql`
  scalar Date
  scalar Time
  scalar DateTime

  type Redwood {
    version: String
  }

  type Query {
    redwood: Redwood
  }
`

export const resolvers = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  Query: {
    redwood: () => ({
      version: '0.0.0',
    }),
  },
}
