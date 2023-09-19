import type _React from 'react'

import type _gql from 'graphql-tag'

// These are the global types exposed to a user's project
// For "internal" global types see ambient.d.ts

declare global {
  const gql: typeof _gql

  // Having this as a type instead of a const allows us to augment/override it
  // in other packages
  type React = typeof _React

  interface Window {
    /** URL or absolute path to the GraphQL serverless function */
    RWJS_API_GRAPHQL_URL: string
    /** URL or absolute path to serverless functions */
    RWJS_API_URL: string
    __REDWOOD__APP_TITLE: string
  }

  type GraphQLOperationVariables = Record<string, any>

  /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
  // Overridable graphQL hook return types
  interface QueryOperationResult<
    TData = any,
    TVariables = GraphQLOperationVariables
  > {
    data: TData | undefined
    loading: boolean
    // @MARK not adding error here, as it gets overridden by type overrides
    // see packages/web/src/apollo/typeOverride.ts
  }

  // not defining it here, because it gets overridden by Apollo provider anyway
  interface MutationOperationResult<TData, TVariables> {}

  // Overridable useQuery and useMutation hooks
  interface GraphQLQueryHookOptions<TData, TVariables> {
    variables?: TVariables
    [key: string]: any
  }

  export interface GraphQLMutationHookOptions<TData, TVariables> {
    variables?: TVariables
    onCompleted?: (data: TData) => void
    [key: string]: any
  }
}
