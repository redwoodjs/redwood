/* eslint-disable no-var */

declare global {
  var RWJS_ENV: {
    RWJS_API_GRAPHQL_URL?: string
    /** URL or absolute path to serverless functions */
    RWJS_API_URL?: string

    __REDWOOD__APP_TITLE?: string
  }
}

export {}
