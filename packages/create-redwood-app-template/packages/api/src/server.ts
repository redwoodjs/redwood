import { ApolloServer, Config } from 'apollo-server-lambda'

/**
 * An ApolloServer wrapper
 *
 * Example
 *
 * import { server } from '@hammerframework/api'
 *
 * export const handler = server({ schema, context }).createHandler()
 *
 */
export const server = (options: Config): ApolloServer => {
  return new ApolloServer(options)
}
