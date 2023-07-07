// RWJS_ENV and RWJS_DEBUG_ENV
// are defined in Webpack.common.js and Vite.config.js

// @NOTE: do not use globalThis on the right side, because webpack cannot access these vars then
globalThis.RWJS_API_GRAPHQL_URL = RWJS_ENV.RWJS_API_GRAPHQL_URL as string
globalThis.RWJS_API_URL = RWJS_ENV.RWJS_API_URL as string
globalThis.__REDWOOD__APP_TITLE = RWJS_ENV.__REDWOOD__APP_TITLE as string
globalThis.RWJS_EXP_STREAMING_SSR = RWJS_ENV.RWJS_EXP_STREAMING_SSR as boolean
globalThis.RWJS_EXP_RSC = RWJS_ENV.RWJS_EXP_RSC as boolean
