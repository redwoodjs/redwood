import { makeExecutableSchema, ITypedef } from 'apollo-server-lambda'
import { GraphQLSchema } from 'graphql'
import merge from 'lodash.merge'

export interface TypeDefResolverExports {
  schema: ITypedef
  resolvers: any
}

/**
 * Merge typedef and resolvers into a single schema
 *
 * @example
 *  import * as todo from 'src/graphql/todo'
 *  import * as currentUser from 'src/graphql/currentUser'
 *
 *  const schema = makeMergedSchema([todo, currentUser])
 */
export const makeMergedSchema = (
  schemas: Array<TypeDefResolverExports>
): GraphQLSchema => {
  const typeDefs = schemas.map(({ schema }) => schema)
  const resolvers = merge(schemas.map(({resolvers}) => resolvers))
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  })
}
