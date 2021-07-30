import { parse, GraphQLResolveInfo } from 'graphql'

import { GraphQLTypeWithFields } from '@redwoodjs/api'

import { makeMergedSchema } from './makeMergedSchema'

describe('makeMergedSchema', () => {
  // Simulate `importAll`
  // ./graphql/tests.sdl.js
  const schemas = {
    tests: {
      schema: parse(`
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
      `),
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
    const queryType = schema.getType('Query') as GraphQLTypeWithFields
    const queryFields = queryType.getFields()

    it('Resolver functions are mapped correctly.', () => {
      expect(
        queryFields.inResolver.resolve &&
          queryFields.inResolver.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("I'm defined in the resolver.")
    })

    it('Resolver functions take preference over service functions.', () => {
      expect(
        queryFields.inResolverAndServices.resolve &&
          queryFields.inResolverAndServices.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("I'm defined in the resolver.")
    })

    it('Service functions are mapped correctly.', () => {
      expect(
        queryFields.inServices.resolve &&
          queryFields.inServices.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("I'm defined in the service.")
    })
  })

  describe('MyOwnType', () => {
    const myOwnType = schema.getType('MyOwnType') as GraphQLTypeWithFields
    const myOwnTypeFields = myOwnType.getFields()

    it('Resolver functions are mapped correctly', () => {
      expect(
        myOwnTypeFields.inTypeResolverAndServices.resolve &&
          myOwnTypeFields.inTypeResolverAndServices.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("MyOwnType: I'm defined in the resolver.")
    })

    it('Resolver functions take preference over service functions.', () => {
      expect(
        myOwnTypeFields.inTypeResolver.resolve &&
          myOwnTypeFields.inTypeResolver.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("MyOwnType: I'm defined in the resolver.")
    })

    it('Service functions are mapped correctly.', () => {
      expect(
        myOwnTypeFields.inTypeServices.resolve &&
          myOwnTypeFields.inTypeServices.resolve(
            null,
            {},
            null,
            {} as GraphQLResolveInfo
          )
      ).toEqual("MyOwnType: I'm defined in the services.")
    })
  })
})
