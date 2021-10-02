import type _React from 'react'

import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'

declare global {
  const React: typeof _React
  const PropTypes: typeof _PropTypes
  const gql: typeof _gql

  interface Window {
    __REDWOOD__API_PROXY_PATH: string
    __REDWOOD__APP_TITLE: string
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // Overridable graphQL hook return types
  interface QueryOperationResult<TData = any, TVariables = any> {
    data: TData | undefined
    loading: boolean
    // @MARK not adding error here, as it gets overriden by type overrides
    // see packages/web/src/apollo/typeOverride.ts
  }

  // not defining it here, because it gets overriden by Apollo provider anyway
  interface MutationOperationResult<TData = any, TVariables = any> {}

  // Overridable useQuery and useMutation hooks
  interface GraphQLQueryHookOptions<TData = any, TVariables = any> {
    variables?: TVariables
    [key: string]: any
  }

  export interface GraphQLMutationHookOptions<TData = any, TVariables = any> {
    variables?: TVariables
    onCompleted?: (data: TData) => void
    [key: string]: any
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
