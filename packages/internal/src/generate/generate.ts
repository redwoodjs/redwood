import { generateGraphQLSchema } from './graphqlSchema'
import { generateTypeDefs } from './typeDefinitions'

export const generate = async () => {
  const schemaPath = await generateGraphQLSchema()
  const typeDefs = await generateTypeDefs()

  return [schemaPath, ...typeDefs]
}
