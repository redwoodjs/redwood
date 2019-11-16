import {
  makeExecutableSchema,
  IResolvers,
  ITypedef,
} from 'apollo-server-lambda'
import { GraphQLSchema } from 'graphql'

export interface TypeDefResolverExports {
  schema: ITypedef
  resolvers: IResolvers
}

/**
 * Merge typedef and resolvers into a single schemas
 *
 * Example
 *
 *  import * as todo from 'src/graphql/todo'
 *  import * as currentUser from 'src/graphql/currentUser'
 *
 *  const schema = makeMergedSchema([todo, currentUser])
 */
export const makeMergedSchema = (
  schemas: Array<TypeDefResolverExports>
): GraphQLSchema => {
  // combine all the typedefs and resolvers into a single thing.
  const typeDefs = schemas.reduce((allTypedefs, { schema }) => {
    return [...allTypedefs, schema]
  }, [])
  const resolvers = schemas.reduce((allResolvers, { resolvers }) => {
    return [...allResolvers, resolvers]
  }, [])

  return makeExecutableSchema({
    typeDefs,
    resolvers,
  })
}
