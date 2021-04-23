import { GraphQLObjectType, GraphQLInterfaceType } from 'graphql'

export type Resolver = (...args: unknown[]) => unknown
export type Services = {
  [funcName: string]: Resolver
}

// e.g. imported service
// [{ posts_posts: {
// createPost: () => {..},
// deletePost: () => {...}
// }, ]
export type ServicesCollection = {
  [serviceName: string]: Services
}
export interface MakeServicesInterface {
  services: ServicesCollection
}

export type MakeServices = (args: MakeServicesInterface) => ServicesCollection

export type GraphQLTypeWithFields = GraphQLObjectType | GraphQLInterfaceType

export type RuleValidator = (name: string) => any
export type ValidatorCollection = {
  validators: Array<RuleValidator>
  skippable: boolean
}

export interface BeforeResolverInterface {
  befores?: Record<string, ValidatorCollection> // {serviceName: {validators:[...], skippable: false}}
}
