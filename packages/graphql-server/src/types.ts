import { GraphQLObjectType, GraphQLInterfaceType, DocumentNode } from 'graphql'

export type Resolver = (...args: unknown[]) => unknown
export type Services = {
  [funcName: string]: Resolver
}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
export type ResolverArgs<TRoot> = { root: ThenArg<TRoot> }

export type SdlGlobImports = {
  [key: string]: {
    schema: DocumentNode
    resolvers: Record<string, unknown>
  }
}
// e.g. imported service
// [{ posts_posts: {
// createPost: () => {..},
// deletePost: () => {...}
// }, ]
export type ServicesGlobImports = {
  [serviceName: string]: Services
}
export interface MakeServicesInterface {
  services: ServicesGlobImports
}

export type MakeServices = (args: MakeServicesInterface) => ServicesGlobImports

export type GraphQLTypeWithFields = GraphQLObjectType | GraphQLInterfaceType
