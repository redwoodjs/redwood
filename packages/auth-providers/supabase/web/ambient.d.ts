/* eslint-disable no-var */

declare global {
  // Provided by Vite.config, or Webpack in the user's project
  var RWJS_ENV: {
    RWJS_API_GRAPHQL_URL: string
    /** URL or absolute path to serverless functions */
    RWJS_API_URL: string
    RWJS_EXP_STREAMING_SSR: boolean
    RWJS_EXP_RSC: boolean

    __REDWOOD__APP_TITLE: string
    __REDWOOD__APOLLO_STATE: NormalizedCacheObject

    RWJS_EXP_SSR_GRAPHQL_ENDPOINT: string
  }
}

export {}
