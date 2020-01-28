import { mergeSchemas } from 'apollo-server-lambda'
import { GraphQLSchema } from 'graphql'
import { IResolversParameter } from 'graphql-tools'
import merge from 'lodash.merge'

export interface TypeDefResolverExports {
  schema: GraphQLSchema
  resolvers: IResolversParameter
}

import * as rootSchema from './rootSchema'

/**
 * Merge graphql type definitions and resolvers into a single executable schema
 *
 * ```js
 * import * as currentUser from 'src/graphql/currentUser'
 * import * as todo from 'src/graphql/todo'
 *
 * const schema = makeMergedSchema([todo, currentUser])
 * ```
 */
export const makeMergedSchema = (
  schemas: Array<TypeDefResolverExports>
): GraphQLSchema => {
  return mergeSchemas({
    schemas: [rootSchema.schema, ...schemas.map(({ schema }) => schema)],
    resolvers: [
      rootSchema.resolvers,
      ...merge(schemas.map(({ resolvers }) => resolvers)),
    ],
  })
}
