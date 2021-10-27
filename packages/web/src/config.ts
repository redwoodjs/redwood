// The `process.env.*` values are replaced by webpack at build time.
global.RWJS_API_GRAPHQL_URL = process.env.RWJS_API_GRAPHQL_URL as string
global.RWJS_API_DBAUTH_URL = process.env.RWJS_API_DBAUTH_URL as string
global.__REDWOOD__APP_TITLE = process.env.__REDWOOD__APP_TITLE as string
