import { gql } from 'src/main'

import { makeMergedSchema } from '../makeMergedSchema/makeMergedSchema'

describe('makeMergedSchema', () => {
  // Simulate `importAll`
  // ./graphql/tests.sdl.js
  const schemas = {
    tests: {
      schema: gql`
        type MyOwnType {
          inTypeResolverAndServices: String
          inTypeResolver: String
          inTypeServices: String
        }

        type Query {
          myOwnType: MyOwnType
          inResolverAndServices: String
          inResolver: String
          inServices: String
        }
      `,
      resolvers: {
        MyOwnType: {
          inTypeResolverAndServices: () =>
            "MyOwnType: I'm defined in the resolver.",
          inTypeResolver: () => "MyOwnType: I'm defined in the resolver.",
        },
        Query: {
          inResolverAndServices: () => "I'm defined in the resolver.",
          inResolver: () => "I'm defined in the resolver.",
        },
      },
    },
  }

  // ./services/tests.js
  const services = {
    tests: {
      MyOwnType: {
        inTypeServices: () => "MyOwnType: I'm defined in the services.",
      },
      inResolverAndServices: () => 'I should NOT be called.',
      inServices: () => "I'm defined in the service.",
    },
  }

  const schema = makeMergedSchema({ schemas, services })

  describe('Query Type', () => {
    const queryType = schema.getType('Query')
    const queryFields = queryType.getFields()

    it('Resolver functions are mapped correctly.', () => {
      expect(queryFields.inResolver.resolve()).toEqual(
        "I'm defined in the resolver."
      )
    })

    it('Resolver functions take preference over service functions.', () => {
      expect(queryFields.inResolverAndServices.resolve()).toEqual(
        "I'm defined in the resolver."
      )
    })

    it('Service functions are mapped correctly.', () => {
      expect(queryFields.inServices.resolve()).toEqual(
        "I'm defined in the service."
      )
    })
  })

  describe('MyOwnType', () => {
    const myOwnType = schema.getType('MyOwnType')
    const myOwnTypeFields = myOwnType.getFields()

    it('Resolver functions are mapped correctly', () => {
      expect(myOwnTypeFields.inTypeResolverAndServices.resolve()).toEqual(
        "MyOwnType: I'm defined in the resolver."
      )
    })

    it('Resolver functions take preference over service functions.', () => {
      expect(myOwnTypeFields.inTypeResolver.resolve()).toEqual(
        "MyOwnType: I'm defined in the resolver."
      )
    })

    it('Service functions are mapped correctly.', () => {
      expect(myOwnTypeFields.inTypeServices.resolve()).toEqual(
        "MyOwnType: I'm defined in the services."
      )
    })
  })
})
