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
  // @ts-ignore
  const React: typeof _React
  // @ts-ignore
  const gql: typeof _gql
  // @ts-ignore
  const PropTypes: typeof _PropTypes
  // @ts-ignore
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  // @ts-ignore
  const mockGraphQLMutation: typeof _mockGraphQLMutation
}
