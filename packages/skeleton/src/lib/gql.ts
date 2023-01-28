import { parse } from 'graphql'

export function parseGraphQL(gql: string) {
  return parse(gql)
}

export function getGraphQLQueryName(gql: string) {
  const ast = parse(gql)
  for (const def of ast.definitions) {
    if (def.kind === 'OperationDefinition' && def.operation === 'query') {
      return def.name?.value
    }
  }
  return undefined
}
