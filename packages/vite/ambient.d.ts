/* eslint-disable no-var */
/// <reference types="react/canary" />

declare global {
  var RWJS_ENV: {
    RWJS_API_GRAPHQL_URL?: string
    /** URL or absolute path to serverless functions */
    RWJS_API_URL?: string

    __REDWOOD__APP_TITLE?: string
  }

  var __REDWOOD__PRERENDER_PAGES: any
}

export {}
