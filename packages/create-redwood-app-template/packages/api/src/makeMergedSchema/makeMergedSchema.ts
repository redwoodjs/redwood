import { mergeSchemas, makeExecutableSchema } from 'apollo-server-lambda'
import merge from 'lodash.merge'
import { GraphQLObjectType } from 'graphql'

import {
  MapSchemaTypeFieldsToService as MapSchemaFieldsToService,
  MapServicesToSchema,
  MakeMergedSchema,
} from '../types'

import * as rootSchema from './rootSchema'

/**
 *
 *
 */
const mapSchemaFieldsToService: MapSchemaFieldsToService = ({
  fields = {},
  resolvers: oldResolvers,
  service,
  serviceName,
}) => {
  return Object.keys(fields).reduce((resolversForType, name) => {
    // Does the resolver already exist in the schema definition?
    if (resolversForType[name]) {
      return resolversForType
    }

    // Does a function exist in the service?
    if (service[name]) {
      return {
        ...resolversForType,
        [name]: service[name],
      }
    }

    // The function does not exist in resolver or service. Let the developer know.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `We could not find a resolver in "${serviceName}.sdl" for "${name}"` +
          `, or an exported "${name}" function in the "${serviceName}" service.`
      )
    }

    return resolversForType
  }, oldResolvers)
}

/**
 * This iterates over all the schemas definitions and figures out which resolvers
 * are missing, it then tries to add the missing resolvers from the corresponding
 * service.
 * A warning is displayed if they cannot be found.
 */
export const mapServicesToSchema: MapServicesToSchema = ({
  schemas: oldSchemas,
  services,
}) => {
  return Object.keys(oldSchemas).reduce((schemas, name) => {
    const { schema: typeDefs, resolvers } = oldSchemas[name]
    // Executable schemas have a decent API for extracing types and fields.
    const schema = makeExecutableSchema({ typeDefs })

    // Auto-map the Query and Mutation types.
    const queryType = schema.getType('Query') as GraphQLObjectType
    const Query = mapSchemaFieldsToService({
      fields: queryType?.getFields(),
      resolvers: resolvers?.Query,
      service: services[name],
      serviceName: name,
    })
    const mutationType = schema.getType('Mutation') as GraphQLObjectType
    const Mutation = mapSchemaFieldsToService({
      fields: mutationType?.getFields(),
      resolvers: resolvers?.Mutation,
      service: services[name],
      serviceName: name,
    })

    return {
      schemas,
      resolvers: {
        ...resolvers,
        Query,
        Mutation,
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
// TODO: Figure out how to make this run at build time.
export const makeMergedSchema: MakeMergedSchema = ({ schemas, services }) => {
  console.log(schemas, services)
}
