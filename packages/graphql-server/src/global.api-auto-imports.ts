/* eslint-disable no-redeclare,  no-undef */
import type _gql from 'graphql-tag'

import type { GlobalContext } from './globalContext'

declare global {
  const gql: typeof _gql
  const context: GlobalContext
}
