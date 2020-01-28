import { mergeSchemas } from 'apollo-server-lambda'
import merge from 'lodash.merge'

import { MakeMergedSchema } from '../types'

import * as rootSchema from './rootSchema'

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
