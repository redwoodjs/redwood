/* eslint-disable no-var */
import type { AuthContextInterface } from './src/index'

declare global {
  // For some reason, in this package, we need to declare it here too
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
