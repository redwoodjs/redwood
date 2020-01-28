import { IResolvers } from 'graphql-tools'
import { DocumentNode, GraphQLSchema } from 'graphql'

export type ImportedServices = { [name: string]: CallableFunction }
export type ImportedSchemas = {
  [name: string]: {
    schema: DocumentNode
    resolvers: IResolvers
  }
}

export interface MakeServicesInterface {
  services: ImportedServices
}
export type Services = { [name: string]: CallableFunction }
export type MakeServices = (args: MakeServicesInterface) => Services

export interface MakeMergedSchemaInterface {
  schemas: ImportedSchemas
  services: Services
}
export type MakeMergedSchema = (
  args: MakeMergedSchemaInterface
) => GraphQLSchema

export type SchemasWithServices = {
  [name: string]: {
    schema: GraphQLSchema
    resolvers: IResolvers
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
  type: string
  schema: GraphQLSchema
  resolvers: IResolvers
  service: Services
  serviceName: string
}
export type MapSchemaTypeFieldsToService = (
  args: MapSchemaTypeFieldsToServiceInterface
) => {
  schema: GraphQLSchema
  resolvers: IResolvers
}
