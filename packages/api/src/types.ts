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

export type SkipArgs = [
  (RuleValidator | Array<RuleValidator> | RuleOptions)?,
  RuleOptions?
]

export type RuleOptions =
  | {
      only: string[]
      except?: undefined
    }
  | {
      except: string[]
      only?: undefined
    }

export interface BeforeResolverSpecType {
  add: (
    functions: RuleValidator | Array<RuleValidator>,
    options?: RuleOptions
  ) => void
  skip: (...args: SkipArgs) => void
}
