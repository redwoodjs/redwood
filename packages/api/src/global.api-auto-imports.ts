/* eslint-disable no-redeclare,  no-undef */
import type { GlobalContext } from './globalContext'
import type _gql from 'graphql-tag'

declare global {
  const gql: typeof _gql
  const context: GlobalContext
}
