import { IResolvers } from 'graphql-tools'
import { DocumentNode, GraphQLSchema } from 'graphql'

export type Schema = {
  schema: DocumentNode,
  resolvers?: IResolvers
}
export type ImportedSchemas = {
  [name: string]: Schema
}

export type Services = { [funcName: string]: any }
export type ImportedServices = {
  [serviceName: string]: Services
}

export interface MakeServicesInterface {
  services: ImportedServices
}
export type MakeServices = (args: MakeServicesInterface) => Services

export type MakeMergedSchema = (
  schemas: ImportedSchemas,
  services: ImportedServices,
  debug: boolean
) => GraphQLSchema

export type SchemasWithServices = {
  [name: string]: {
    schema: GraphQLSchema
    resolvers?: IResolvers
  }
}
export interface MapServicesToSchemaInterface {
  schemas: ImportedSchemas
  services: Services
}
export type MapServicesToSchema = (
  args: MapServicesToSchemaInterface
) => SchemasWithServices

export interface MapSchemaTypeFieldsToServiceInterface {
  fields: { [key: string]: any }
  resolvers?: any
  service: Services
}
export type MapSchemaTypeFieldsToService = (
  args: MapSchemaTypeFieldsToServiceInterface
) => {
  schema: GraphQLSchema
  resolvers: IResolvers
}
