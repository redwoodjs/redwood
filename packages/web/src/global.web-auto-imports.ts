import type _React from 'react'

import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'

declare global {
  const React: typeof _React
  const PropTypes: typeof _PropTypes
  const gql: typeof _gql

  interface Window {
    __REDWOOD__API_PROXY_PATH: string
  }

  // Overridable graphQL hook return types
  interface QueryOperationResult<TData = any> {
    data: TData | null
    loading: boolean
    error?: Error | any
    [key: string]: any
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface MutationOperationResult<TData = any, TVariables = any> {}
}
