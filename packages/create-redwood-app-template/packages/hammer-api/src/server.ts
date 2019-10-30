import { queryType, makeSchema } from 'nexus'
import { ApolloServer } from 'apollo-server-lambda'

export interface Config {
  context?: object
  types: object
}

export const server = (
  { context, types }: Config = { types: {} }
): ApolloServer => {

  const BaseQueryType = queryType({
    definition(t) {
      t.string('help', {
        resolve() {
          return `Learn more about adding nexus definitions over here: "https://nexus.js.org/docs/api-extendtype"`
        },
      })
    },
  })

  const schema = makeSchema({
    types: [BaseQueryType, ...Object.values(types)],
    outputs: false,
  })

  return new ApolloServer({
    schema,
    context,
  })
}
