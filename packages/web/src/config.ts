// The `process.env.*` values are replaced by webpack at build time.
globalThis.RWJS_API_GRAPHQL_URL = process.env.RWJS_API_GRAPHQL_URL as string
globalThis.RWJS_API_DBAUTH_URL = process.env.RWJS_API_DBAUTH_URL as string
globalThis.RWJS_API_URL = process.env.RWJS_API_URL as string
globalThis.__REDWOOD__APP_TITLE = process.env.__REDWOOD__APP_TITLE as string
