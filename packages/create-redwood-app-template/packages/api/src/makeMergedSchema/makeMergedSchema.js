import { mergeSchemas, addResolveFunctionsToSchema } from 'apollo-server-lambda'
import merge from 'lodash.merge'
import omitBy from 'lodash.omitby'

import * as rootSchema from './rootSchema'

class SchemaFieldResolverNotFoundError extends Error { }
const mapFieldsToService = ({
  fields = {},
  resolvers: unmappedResolvers,
  services,
}) =>
  Object.keys(fields).reduce((resolvers, name) => {
    // Does the resolver already exist in the schema definition?
    if (resolvers?.[name]) {
      return resolvers
    }

    // Does a function exist in the service?
    if (services?.[name]) {
      return {
        ...resolvers,
        // Map the resolver type to the service type.
        [name]: (root, args, context) =>
          services[name](args, { root, context }),
      }
    }

    return resolvers
  }, unmappedResolvers)

/**
 * This iterates over all the schemas definitions and figures out which resolvers
 * are missing, it then tries to add the missing resolvers from the corresponding
 * service.
 * A warning is displayed if they cannot be found.
 */
const mergeResolversWithServices = ({ schema, resolvers, services }) => {
  const mergedServices = merge(
    {},
    ...Object.keys(services).map((name) => services[name])
  )
  return {
    ...resolvers,
    Query: mapFieldsToService({
      fields: schema.getType('Query')?.getFields(),
      resolvers: resolvers?.Query,
      services: mergedServices,
    }),
    Mutation: mapFieldsToService({
      fields: schema.getType('Mutation')?.getFields(),
      resolvers: resolvers?.Mutation,
      services: mergedServices,
    }),
  }
}

const mergeResolvers = (schemas) =>
  omitBy(
    merge(
      {},
      ...[
        rootSchema.resolvers,
        ...Object.values(schemas).map(({ resolvers }) => resolvers),
      ]
    ),
    (v) => typeof v === 'undefined'
  )

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
export const makeMergedSchema = ({ schemas, services }) => {
  const schema = mergeSchemas({
    schemas: [
      rootSchema.schema,
      ...Object.values(schemas).map(({ schema }) => schema),
    ],
  })

  const resolvers = mergeResolversWithServices({
    schema,
    resolvers: mergeResolvers(schemas),
    services,
  })
  addResolveFunctionsToSchema({ schema, resolvers })

  return schema
}
