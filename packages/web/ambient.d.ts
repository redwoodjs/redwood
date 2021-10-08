/* eslint-disable no-var */
import type { HelmetData } from 'react-helmet-async'

import type { AuthContextInterface } from '@redwoodjs/auth'

declare global {
  var __REDWOOD__PRERENDERING: boolean
  var __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
  var __REDWOOD__APP_TITLE: string
  var __REDWOOD__USE_AUTH: () => AuthContextInterface

  /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
  var __REDWOOD__API_PROXY_PATH: string
  /**
   * FQDN or absolute path to the GraphQL serverless function, without the trailing slash.
   * Example: `./redwood/functions/graphql` or `https://api.redwoodjs.com/graphql`
   */
  var RWJS_API_GRAPHQL_URL: string
  /**
   * FQDN or absolute path to the DbAuth serverless function, without the trailing slash.
   * Example: `./redwood/functions/auth` or `https://api.redwoodjs.com/auth`
   **/
  var RWJS_API_DBAUTH_URL: string

  /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
  var __REDWOOD__API_URL: string
  /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
  var __REDWOOD__API_GRAPHQL_SERVER_PATH: string

  namespace NodeJS {
    interface Global {
      /**
       * This global is set to true by the prerendering CLI command.
       */
      __REDWOOD__PRERENDERING: boolean
      __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
      __REDWOOD__APP_TITLE: string
      __REDWOOD__USE_AUTH: () => AuthContextInterface
      /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
      __REDWOOD__API_PROXY_PATH: string
      /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
      __REDWOOD__API_URL: string
      /** @deprecated Please use `RWJS_API_GRAPHQL_URL` or `RWJS_API_DBAUTH_URL` */
      __REDWOOD__API_GRAPHQL_SERVER_PATH: string

      /** FQDN or absolute path to the GraphQL serverless function */
      RWJS_API_GRAPHQL_URL: string
      /** FQDN or absolute path to the DbAuth serverless function */
      RWJS_API_DBAUTH_URL: string
    }
  }
}

export {}
