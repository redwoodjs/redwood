import type _gql from 'graphql-tag'
import type _React from 'react'
import type _PropTypes from 'prop-types'

declare global {
  const React: typeof _React
  const PropTypes: typeof _PropTypes
  const gql: typeof _gql

  interface Window {
    __REDWOOD__API_PROXY_PATH: string
  }
}
