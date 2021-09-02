import { parse, GraphQLResolveInfo } from 'graphql'
import gql from 'graphql-tag'

import { makeDirectives } from '../../directives/makeDirectives'
import { makeServices } from '../../makeServices'
import {
  GraphQLTypeWithFields,
  ServicesGlobImports,
  SdlGlobImports,
} from '../../types'
import { makeMergedSchema } from '../makeMergedSchema'

describe('makeMergedSchema', () => {
  // Simulate `importAll`
  // ./graphql/tests.sdl.js
  const sdls = {
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
          foo: String @foo
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
          foo: () => "I'm using @foo directive",
        },
      },
    },
  } as unknown as SdlGlobImports

  // ./services/tests.js
  const services = {
    tests: {
      MyOwnType: {
        inTypeServices: () => "MyOwnType: I'm defined in the services.",
      },
      inResolverAndServices: () => 'I should NOT be called.',
      inServices: () => "I'm defined in the service.",
    },
  } as unknown as ServicesGlobImports

  // mimics teh directives glob file structure
  const directiveFiles = {
    foo_directive: {
      foo: () => 'I am foo',
      schema: gql`
        directive @foo on FIELD_DEFINITION
      `,
    },
    nested_bazinga_directive: {
      bazinga: async () => 'I am bazinga, async',
      schema: gql`
        directive @bazinga on FIELD_DEFINITION
      `,
    },
    heavily_nested_bar_directive: {
      bar: async () => 'I am bar, async',
      schema: gql`
        directive @bar on FIELD_DEFINITION
      `,
    },
  }

  const schema = makeMergedSchema({
    sdls,
    services: makeServices({ services }),
    directives: makeDirectives(directiveFiles),
  })

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

  describe('Directives', () => {
    it('Confirms that directives have been made from a set of files and added to schema.', () => {
      expect(schema.getDirective('foo')).toBeTruthy()
      expect(schema.getDirective('bazinga')).toBeTruthy()
      expect(schema.getDirective('bar')).toBeTruthy()
    })

    it('Checks that an unknown directive does not get added to the schema.', () => {
      expect(schema.getDirective('misdirective')).toBeFalsy()
    })
  })
})
