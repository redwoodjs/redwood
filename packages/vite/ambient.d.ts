/* eslint-disable no-var */
/// <reference types="react/canary" />
import type { HelmetServerState } from 'react-helmet-async'

declare global {
  // Provided by Vite.config, or Webpack in the user's project
  // but "regsitered" in packages/vite/src/streaming/registerGlobals.ts
  // for it to be available to framework code
  var RWJS_ENV: {
    RWJS_API_GRAPHQL_URL: string
    /** URL or absolute path to serverless functions */
    RWJS_API_URL: string
    RWJS_EXP_STREAMING_SSR: boolean
    RWJS_EXP_RSC: boolean
    RWJS_EXP_SSR_GRAPHQL_ENDPOINT: string

    __REDWOOD__APP_TITLE: string
  }

  var RWJS_DEBUG_ENV: {
    RWJS_SRC_ROOT: string
    REDWOOD_ENV_EDITOR: string
  }

  var __REDWOOD__PRERENDER_PAGES: any

  var __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetServerState }
}

export {}
