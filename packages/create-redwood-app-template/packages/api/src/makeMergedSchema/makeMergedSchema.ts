import { mergeSchemas, makeExecutableSchema } from 'apollo-server-lambda'
import merge from 'lodash.merge'
import omitBy from 'lodash.omitby'
import { GraphQLObjectType } from 'graphql'

import {
  MapSchemaTypeFieldsToService as MapSchemaFieldsToService,
  MapServicesToSchema as MapSchemasToServices,
  MakeMergedSchema,
} from '../types'

import * as rootSchema from './rootSchema'

class SchemaFieldResolverNotFoundError extends Error {}
const mapSchemaFieldsToService: MapSchemaFieldsToService = ({
  fields = {},
  resolvers: oldResolvers,
  service,
}) => {
  return Object.keys(fields).reduce((resolversForType, name) => {
    // Does the resolver already exist in the schema definition?
    if (resolversForType?.[name]) {
      return resolversForType
    }

    // Does a function exist in the service?
    if (service?.[name]) {
      return {
        ...resolversForType,
        [name]: service[name],
      }
    }

    // The function does not exist in resolvers or service. Let the developer know that
    // they've got a potential bug.
    throw new SchemaFieldResolverNotFoundError(
      `Could not find resolver or service for "${name}".`
    )
  }, oldResolvers)
}

/**
 * This iterates over all the schemas definitions and figures out which resolvers
 * are missing, it then tries to add the missing resolvers from the corresponding
 * service.
 * A warning is displayed if they cannot be found.
 */
const mapSchemasToServices: MapSchemasToServices = ({ schemas, services }) => {
  return Object.keys(schemas).reduce((mappedSchemas, name) => {
    // Executable schemas have a great API that's useful for extracing types and fields.
    const { schema: typeDefs, resolvers } = schemas[name]
    const schema = makeExecutableSchema({ typeDefs })
    const service = services[name]

    // Auto-map the Query and Mutation types resolvers to the services.
    const queryType = schema.getType('Query') as GraphQLObjectType
    const Query = mapSchemaFieldsToService({
      fields: queryType?.getFields(),
      resolvers: resolvers?.Query,
      service,
    })
    const mutationType = schema.getType('Mutation') as GraphQLObjectType
    const Mutation = mapSchemaFieldsToService({
      fields: mutationType?.getFields(),
      resolvers: resolvers?.Mutation,
      service,
    })

    return {
      ...mappedSchemas,
      [name]: {
        schema,
        resolvers: {
          ...resolvers,
          Query,
          Mutation,
        },
      },
    }
  }, {})
}

/**
 * Merge GraphQL schemas and resolvers into a single schema.
 *
 * @example
 * ```js
 * const schemas = importAll('api', 'graphql')
 * const services = importAll('api', 'services')
 *
 * const schema = makeMergedSchema({
 *  schema,
 *  services: makeServices({ services }),
 * })
 * ```
 */
export const makeMergedSchema: MakeMergedSchema = ({ schemas, services }) => {
  const mappedSchemas = mapSchemasToServices({ schemas, services })
  const resolvers = omitBy(
    merge(
      {},
      ...[
        rootSchema.resolvers,
        ...Object.values(mappedSchemas).map(({ resolvers }) => resolvers),
      ]
    ),
    (v) => typeof v === 'undefined'
  )

  return mergeSchemas({
    schemas: [
      rootSchema.schema,
      ...Object.values(mappedSchemas).map(({ schema }) => schema),
    ],
    resolvers,
  })
}
