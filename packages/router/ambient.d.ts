/* eslint-disable no-var */

declare global {
  var __REDWOOD__PRERENDERING: boolean
  /**
   * URL or absolute path to the GraphQL serverless function, without the trailing slash.
   * Example: `./redwood/functions/graphql` or `https://api.redwoodjs.com/graphql`
   */
  var RWJS_API_GRAPHQL_URL: string
  /**
   * URL or absolute path to the DbAuth serverless function, without the trailing slash.
   * Example: `./redwood/functions/auth` or `https://api.redwoodjs.com/auth`
   **/
  var RWJS_API_DBAUTH_URL: string

  /**
   * URL or absolute path to serverless functions, without the trailing slash.
   * Example: `./redwood/functions/` or `https://api.redwoodjs.com/`
   **/
  var RWJS_API_URL: string

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
