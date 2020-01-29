import { IResolvers } from 'graphql-tools'
import { DocumentNode, GraphQLSchema } from 'graphql'

export type Services = { [funcName: string]: any }
export type ImportedServices = {
  [serviceName: string]: Services
}
export interface MakeServicesInterface {
  services: ImportedServices
}
export type MakeServices = (args: MakeServicesInterface) => Services
