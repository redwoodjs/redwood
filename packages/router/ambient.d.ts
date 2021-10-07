/* eslint-disable no-var */

declare global {
  var __REDWOOD__PRERENDERING: boolean
  var __REDWOOD__API_PROXY_PATH: string
  var __REDWOOD__API_URL: string
  var __REDWOOD__API_GRAPHQL_SERVER_PATH: string
  namespace NodeJS {
    interface Global {
      /**
       * This global is set to true by the prerendering CLI command.
       */
      __REDWOOD__PRERENDERING: boolean
      __REDWOOD__API_PROXY_PATH: string
      __REDWOOD__API_URL: string
      __REDWOOD__API_GRAPHQL_SERVER_PATH: string
    }
  }
}

export {}
