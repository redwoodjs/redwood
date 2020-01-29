import { gql } from 'src/main'
import { GraphQLObjectType } from 'graphql'

import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'
import { ImportedSchemas, ImportedServices } from '../types'

describe('makeMergedSchema', () => {
  // Simulate `importAll`
  const schemas: ImportedSchemas = {
    tests: {
      schema: gql`
        type Query {
          inResolverAndServices: String
          inResolver: String
          inServices: String
        }

        type Mutation {
          makeBlog: String
        }
      `,
      resolvers: {
        Query: {
          inResolverAndServices: (): string => "I'm defined in the resolver.",
          inResolver: (): string => "I'm defined in the resolver.",
        },
      },
    },
  }

  const services: ImportedServices = {
    tests: {
      inResolverAndServices: (): string => 'I should NOT be called.',
      inServices: (): string => "I'm defined in the service.",
      makeBlog: (): string => "I'm defined in the service.",
    },
  }

  const schema = makeMergedSchema({ schemas, services })
  const queryType = schema.getType('Query') as GraphQLObjectType
  const queryFields = queryType.getFields()

  it('Resolver functions take preference over service functions.', () => {
    expect(queryFields.inResolverAndServices.resolve()).toEqual(
      "I'm defined in the resolver."
    )
  })

  it('Service functions are correctly mapped', () => {
    expect(queryFields.inServices.resolve()).toEqual(
      "I'm defined in the service."
    )
  })

  it('A schema that defines a field which has no resolver or service function throws', () => {
    expect(() => {
      makeMergedSchema({
        schemas: {
          thisThrows: {
            schema: gql`
              type Query {
                imGoingToThrow: String
              }
            `,
          },
        },
        services: {},
      })
    }).toThrow('Could not find resolver or service for "imGoingToThrow".')
  })
})
