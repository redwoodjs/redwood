import { makeExecutableSchema, ITypedef } from 'apollo-server-lambda'
import { GraphQLSchema } from 'graphql'
import merge from 'lodash.merge'

export interface TypeDefResolverExports {
  schema: ITypedef
  resolvers: any
}

/**
 * Merge graphql type defintions and resolvers into a single executable schema
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
  const typeDefs = schemas.map(({ schema }) => schema)
  const resolvers = merge(schemas.map(({ resolvers }) => resolvers))
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  })
}
