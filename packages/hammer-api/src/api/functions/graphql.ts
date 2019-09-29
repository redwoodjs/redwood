import path from 'path'
import { queryType, makeSchema } from 'nexus'
import { ApolloServer } from 'apollo-server-lambda'
import { getHammerConfig } from '@hammerframework/hammer-core'

const schemaTypegenOuputs = () => {
  // Type generation only happens during development
  const hammerConfig = getHammerConfig()
  return {
    schema: path.join(hammerConfig.api.paths.generated, 'api-schema.graphql'),
    typegen: path.join(
      hammerConfig.api.paths.generated,
      'generated-types.d.ts'
    ),
  }
}

export interface Config {
  context?: object
  schemaTypes: object
}

export const graphQLServerlessFunction = (
  { context, schemaTypes }: Config = { schemaTypes: {} }
) => {
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
    types: [BaseQueryType, ...Object.values(schemaTypes)],
    outputs:
      process.env.NODE_ENV === 'development' ? schemaTypegenOuputs() : false,
  })

  return new ApolloServer({
    schema,
    context,
  })
}
