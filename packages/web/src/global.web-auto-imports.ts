import type _React from 'react'

import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'

declare global {
  const React: typeof _React
  const PropTypes: typeof _PropTypes
  const gql: typeof _gql

  interface Window {
    RWJS_API_DBAUTH_URL: string
    RWJS_API_GRAPHQL_URL: string
    __REDWOOD__APP_TITLE: string
  }

  type GraphQLOperationVariables = Record<string, any>

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // Overridable graphQL hook return types
  interface QueryOperationResult<
    TData = any,
    TVariables = GraphQLOperationVariables
  > {
    data: TData | undefined
    loading: boolean
    // @MARK not adding error here, as it gets overriden by type overrides
    // see packages/web/src/apollo/typeOverride.ts
  }

  // not defining it here, because it gets overriden by Apollo provider anyway
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
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
