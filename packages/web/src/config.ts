// The `process.env.*` values are replaced by webpack at build time.
global.__REDWOOD__API_URL = process.env.__REDWOOD_API_URL as string
global.__REDWOOD__API_GRAPHQL_SERVER_PATH = process.env
  .__REDWOOD_API_GRAPHQL_SERVER_PATH as string
global.__REDWOOD__APP_TITLE = process.env.__REDWOOD__APP_TITLE as string
