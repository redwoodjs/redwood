/* eslint-disable no-var */
import type { HelmetServerState } from 'react-helmet-async'

import type { AuthContextInterface } from '@redwoodjs/auth'

declare global {
  var __REDWOOD__PRERENDERING: boolean
  var __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetServerState }
  var __REDWOOD__APP_TITLE: string
  var __REDWOOD__USE_AUTH: () => AuthContextInterface

  /** URL or absolute path to the DbAuth serverless function */
  var RWJS_API_DBAUTH_URL: string
  /** URL or absolute path to the GraphQL serverless function */
  var RWJS_API_GRAPHQL_URL: string
  /** URL or absolute path to serverless functions */
  var RWJS_API_URL: string
  /** Path to Redwood app source used by Development Error page to resolve source code paths */
  var RWJS_SRC_ROOT: string

  namespace NodeJS {
    interface Global {
      /**
       * This global is set to true by the prerendering CLI command.
       */
      __REDWOOD__PRERENDERING: boolean
      __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetServerState }
      __REDWOOD__APP_TITLE: string
      __REDWOOD__USE_AUTH: () => AuthContextInterface

      /** URL or absolute path to the GraphQL serverless function */
      RWJS_API_GRAPHQL_URL: string
      /** URL or absolute path to the DbAuth serverless function */
      RWJS_API_DBAUTH_URL: string
      /** URL or absolute path to serverless functions */
      RWJS_API_URL: string
    }
  }
}

export {}
