/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
import type _React from 'react'
import type _gql from 'graphql-tag'
import type _PropTypes from 'prop-types'
import type {
  mockGraphQLMutation as _mockGraphQLMutation,
  mockGraphQLQuery as _mockGraphQLQuery,
} from '@redwoodjs/testing'

declare global {
  // We reduce the number of imports that a user has to do by making them
  // globals via `Webpack.ProvidePlugin`
  const React: typeof _React
  const gql: typeof _gql
  const PropTypes: typeof _PropTypes
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  const mockGraphQLMutation: typeof _mockGraphQLMutation
}
