import { ApolloServer, Config } from 'apollo-server-lambda'

/**
 * An ApolloServer wrapper
 *
 * @example
 * export const handler = server({ schema, context }).createHandler()
 */
export const server = (options: Config): ApolloServer => {
  return new ApolloServer(options)
}
