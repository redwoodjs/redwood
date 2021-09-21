import { parse, GraphQLResolveInfo } from 'graphql'
import gql from 'graphql-tag'

import {
  makeDirectivesForPlugin,
  createTransformerDirective,
  createValidatorDirective,
} from '../../directives/makeDirectives'
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
          myOwnType: MyOwnType @foo
          inResolverAndServices: String @foo
          inResolver: String @foo
          inServices: String @foo
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

  // mimics the directives glob file structure
  const fooSchema = gql`
    directive @foo on FIELD_DEFINITION
  `

  const bazingaSchema = gql`
    directive @bazinga on FIELD_DEFINITION
  `

  const barSchema = gql`
    directive @bar on FIELD_DEFINITION
  `
  const directiveFiles = {
    foo_directive: {
      schema: fooSchema,
      foo: createTransformerDirective(fooSchema, () => 'I am foo'),
    },
    nested_bazinga_directive: {
      bazinga: createValidatorDirective(bazingaSchema, async () => {
        throw new Error('Only soft kittens allowed')
      }),
      schema: bazingaSchema,
    },
    heavily_nested_bar_directive: {
      bar: createTransformerDirective(barSchema, () => 'I am bar'),
      schema: barSchema,
    },
  }

  const schema = makeMergedSchema({
    sdls,
    services: makeServices({ services }),
    directives: makeDirectivesForPlugin(directiveFiles),
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

  it('throws when directives not added to queries and mutations', () => {
    const sdlsWithoutDirectives = {
      withoutDirective: {
        schema: parse(`
          type Query {
            bazinga: String
          }
        `),
        resolvers: {},
      },
    }

    expect(() =>
      makeMergedSchema({
        sdls: sdlsWithoutDirectives,
        services: makeServices({ services }),
        directives: makeDirectivesForPlugin(directiveFiles),
      })
    ).toThrowError()
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
