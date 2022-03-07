import { Kind, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'

export const REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE = 'Value is not a string'

export const REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE =
  'Can only validate strings or string lists as Roles but got a:'
const validate = (value: any) => {
  console.log(value, '---> validate') // ?

  if (typeof value !== 'string' || value === '' || value === undefined) {
    throw new TypeError(
      `${REDWOOD_AUTH_ROLES_VALIDATE_ERROR_MESSAGE}: ${value}`
    )
  }

  return value
}

/**
 *
 * The serialize method converts the scalar's back-end representation to a JSON-compatible format.
 *
 * Handles a single string role or an array of string roles which are JSON compatible
 *
 * @param value
 * @returns
 */
const serializeRoles = (value: any): string | string[] => {
  console.log(value, '---> serializeRoles')

  if (Array.isArray(value)) {
    return value.map((val) => validate(val))
  }

  return validate(value)
}

/**
 *
 * The parseValue method converts the scalar's JSON value to its back-end representation
 *
 * Handles a single string role or an array of string roles which are JSON compatible
 * *
 * @param value
 * @returns
 */
const parseRoles = (value: any): string | string[] => {
  console.log(value, '---> parseRoles')
  if (Array.isArray(value)) {
    return value.map((val) => validate(val))
  }

  return validate(value)
}

const parseLiteralRoles = (ast: any): string | string[] => {
  if (ast.kind !== Kind.STRING && ast.kind !== Kind.LIST) {
    throw new TypeError(
      `${REDWOOD_AUTH_ROLES_PARSE_KIND_ERROR_MESSAGE} ${ast.kind}`
    )
  }

  if (ast.kind === Kind.LIST) {
    console.log(ast.values, '---> parseLiteralRoles list')

    return ast.values.map((value: any) => validate(value.value))
  }

  console.log(ast.value, '---> parseLiteralRoles')

  return validate(ast.value)
}

const GraphQLRedwoodAuthRolesConfig: GraphQLScalarTypeConfig<
  string | string[],
  string | string[]
> = {
  name: `Roles`,

  description: `Roles are a string or list of strings used with the requireAuth directive`,

  serialize: serializeRoles,
  parseValue: parseRoles,
  parseLiteral: parseLiteralRoles,

  extensions: {
    codegenScalarType: 'string' || 'string[]',
  },
}

export const GraphQLRedwoodAuthRoles: GraphQLScalarType = new GraphQLScalarType(
  GraphQLRedwoodAuthRolesConfig
)
