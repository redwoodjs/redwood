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

export type RuleValidator = (name: string, ...inputs: Array<unknown>) => void
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
  /**
   * @param  {RuleValidator|Array<RuleValidator>} functions - Function or Array of Functions (can be async or not) that validates whether service function is allowed to run. Should Throw if not.
   * @param {RuleOptions} [options]  - Optionally pass to selectively apply rule to specific service functions
   */
  add: (
    functions: RuleValidator | Array<RuleValidator>,
    options?: RuleOptions
  ) => void
  /**
   *
   * @param {RuleValidator|Array<RuleValidator>} functions - Function handler or Array of Function handlers to skip.
   * @param {RuleOptions} [options]  - Optionally pass to selectively skip rule for specific service functions
   *
   * @example <caption>Skip all rules</caption>
   * rules.skip()
   * @example <caption>Skip single rule</caption>
   * rules.skip(requireAuth)
   * @example <caption>Skip single rule, for a single service function</caption>
   * rules.skip(requireAuth, {only: 'posts'})
   *
   * */
  skip: (...args: SkipArgs) => void
}
