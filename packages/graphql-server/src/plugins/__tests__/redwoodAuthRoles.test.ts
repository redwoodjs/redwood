/* global describe, test, expect */

import { Kind } from 'graphql/language'

import {
  GraphQLRedwoodAuthRoles,
  REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE,
  REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE,
} from '../../scalars'

describe('RedwoodAuthRoles', () => {
  describe('accepts a string as the role value', () => {
    describe('valid', () => {
      test('serialize', () => {
        expect(GraphQLRedwoodAuthRoles.serialize('admin')).toEqual('admin')
      })

      test('parseValue', () => {
        expect(GraphQLRedwoodAuthRoles.parseValue('admin')).toEqual('admin')
      })

      test('parseLiteral', () => {
        expect(
          GraphQLRedwoodAuthRoles.parseLiteral(
            {
              value: 'admin',
              kind: Kind.STRING,
            },
            {}
          )
        ).toEqual('admin')
      })

      test('parseLiteral', () => {
        expect(
          GraphQLRedwoodAuthRoles.parseLiteral(
            {
              value: 'admin',
              kind: Kind.STRING,
            },
            {}
          )
        ).toEqual('admin')
      })
    })

    describe('invalid', () => {
      describe('when null', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize(null)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue(null)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              { value: null, kind: Kind.STRING },
              {}
            )
          ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
        })
      })

      describe('when undefined', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize(undefined)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue(undefined)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              { value: undefined, kind: Kind.STRING },
              {}
            )
          ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
        })
      })

      describe('when empty', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize('')).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue('')).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              { value: '', kind: Kind.STRING },
              {}
            )
          ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
        })
      })

      describe('when a number', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize(1234)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue(1234)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              {
                value: '1234',
                kind: Kind.INT,
              },
              {}
            )
          ).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE} Int`)
          )
        })
      })

      describe('when a boolean', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize(false)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue(false)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              { value: false, kind: Kind.BOOLEAN },
              {}
            )
          ).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE} Bool`)
          )
        })
      })

      describe('when a float', () => {
        test('serialize', () => {
          expect(() => GraphQLRedwoodAuthRoles.serialize(123.45)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseValue', () => {
          expect(() => GraphQLRedwoodAuthRoles.parseValue(123.45)).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
          )
        })

        test('parseLiteral', () => {
          expect(() =>
            GraphQLRedwoodAuthRoles.parseLiteral(
              { value: '123.45', kind: Kind.FLOAT },
              {}
            )
          ).toThrow(
            RegExp(`${REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE} Float`)
          )
        })
      })
    })

    describe('when an object', () => {
      test('serialize', () => {
        expect(() => GraphQLRedwoodAuthRoles.serialize({ foo: 'bar' })).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
        )
      })

      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue({ foo: 'bar' })
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })

      test('parseLiteral', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseLiteral({
            fields: [
              {
                kind: Kind.OBJECT_FIELD,
                name: {
                  kind: Kind.NAME,
                  value: 'foo',
                },
                value: {
                  kind: Kind.STRING,
                  value: 'bar',
                },
              },
            ],
            kind: Kind.OBJECT,
          })
        ).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE} Object`)
        )
      })
    })
  })

  describe('accepts an array strings as the role value', () => {
    describe('valid', () => {
      describe('valid single array item', () => {
        test('serialize', () => {
          expect(GraphQLRedwoodAuthRoles.serialize(['editor'])).toEqual([
            'editor',
          ])
        })

        test('parseValue', () => {
          expect(GraphQLRedwoodAuthRoles.parseValue(['publisher'])).toEqual([
            'publisher',
          ])
        })
      })

      describe('valid multi-item string array item', () => {
        test('serialize', () => {
          expect(GraphQLRedwoodAuthRoles.serialize(['admin,editor'])).toEqual([
            'admin,editor',
          ])
        })
        test('parseValue', () => {
          expect(
            GraphQLRedwoodAuthRoles.parseValue(['author', 'editor'])
          ).toEqual(['author', 'editor'])
        })
      })
    })
  })

  describe('invalid', () => {
    describe('invalid single array item', () => {
      test('serialize', () => {
        expect(() => GraphQLRedwoodAuthRoles.serialize([''])).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
        )
      })

      test('serialize', () => {
        expect(() => GraphQLRedwoodAuthRoles.serialize([null])).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
        )
      })

      test('parseValue', () => {
        expect(() => GraphQLRedwoodAuthRoles.parseValue([null])).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
        )
      })
    })

    describe('invalid multi-item string array item with empty role', () => {
      test('serialize', () => {
        expect(() => GraphQLRedwoodAuthRoles.serialize(['admin', ''])).toThrow(
          RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`)
        )
      })
      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue(['author', ''])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
    })

    describe('invalid multi-item string array item with null role', () => {
      test('serialize', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.serialize(['admin', null])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue(['author', null])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
    })

    describe('invalid multi-item string array item with undefined role', () => {
      test('serialize', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.serialize(['admin', undefined])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue(['author', undefined])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
    })

    describe('invalid multi-item string array item with numeric role', () => {
      test('serialize', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.serialize(['admin', 1234])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue(['author', 1234])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
    })

    describe('invalid multi-item string array item with boolean role', () => {
      test('serialize', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.serialize(['admin', false])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
      test('parseValue', () => {
        expect(() =>
          GraphQLRedwoodAuthRoles.parseValue(['author', false])
        ).toThrow(RegExp(`${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}`))
      })
    })
  })
})
