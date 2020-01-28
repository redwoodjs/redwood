import { mergeSchemas, makeExecutableSchema } from 'apollo-server-lambda'
import merge from 'lodash.merge'
import { GraphQLObjectType } from 'graphql'

import {
  MapSchemaTypeFieldsToService,
  MapServicesToSchema,
  MakeMergedSchema,
} from '../types'

import * as rootSchema from './rootSchema'

// returns a resolver
const mapSchemaTypeFieldsToService: MapSchemaTypeFieldsToService = ({
  type,
  schema,
  resolvers: oldResolvers,
  service,
  serviceName,
}) => {
  const schemaType = schema.getType(type) as GraphQLObjectType
  if (typeof schemaType === 'undefined') {
    // The Type is not defined, so don't need to map any resolvers for it.
    return undefined
  }

  return Object.keys(schemaType?.getFields()).reduce(
    (resolversForType, name) => {
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

      // The function does not exist in resolver, or service
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `We could not find a resolver in "${serviceName}.sdl" for "${type}.${name}"` +
            `, or a exported "${name}" function in the "${serviceName}" service.`
        )
      }

      return resolversForType
    },
    oldResolvers[type]
  )
}

/**
 * Iterates over all the schemas (api/graphql) and determines which resolvers are
 * missing. Missing resolvers are added from services. A warning is displayed if
 * they cannot be found.
 */
export const mapServicesToSchema: MapServicesToSchema = ({
  schemas: oldSchemas,
  services,
}) => {
  return Object.keys(oldSchemas).reduce((schemas, name) => {
    const { schema: typeDefs, resolvers } = oldSchemas[name]
    // Convert the typeDef to a GraphQL schema since it has a decent API for grabbing
    // the types and fields.
    const schema = makeExecutableSchema({ typeDefs })

    const Query = mapSchemaTypeFieldsToService({
      type: 'Query',
      schema,
      resolvers,
      service: services[name],
      serviceName: name,
    })
    const Mutation = mapSchemaTypeFieldsToService({
      type: 'Mutation',
      schema,
      resolvers,
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
export const makeMergedSchema: MakeMergedSchema = ({ schemas, services }) => {}
