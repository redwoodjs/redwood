import { gql } from 'src/main'


import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'

describe('makeMergedSchema', () => {
  // Simulate `importAll`
  const schemas = {
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
          inResolverAndServices: () => "I'm defined in the resolver.",
          inResolver: () => "I'm defined in the resolver.",
        },
      },
    },
  }

  const services = {
    tests: {
      inResolverAndServices: () => 'I should NOT be called.',
      inServices: () => "I'm defined in the service.",
      makeBlog: () => "I'm defined in the service.",
    },
  }

  const schema = makeMergedSchema({ schemas, services })
  const queryType = schema.getType('Query')
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
