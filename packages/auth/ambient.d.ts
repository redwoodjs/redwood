/* eslint-disable no-var */
import type { AuthContextInterface } from './src/index'

declare global {
  // For some reason, in this package, we need to declare it here too
  var __REDWOOD__USE_AUTH: () => AuthContextInterface
  var __REDWOOD__API_PROXY_PATH: string
  var __REDWOOD__API_URL: string
  var __REDWOOD__API_GRAPHQL_SERVER_PATH: string

  namespace NodeJS {
    interface Global {
      __REDWOOD__USE_AUTH: () => AuthContextInterface
      __REDWOOD__API_PROXY_PATH: string
      __REDWOOD__API_URL: string
      __REDWOOD__API_GRAPHQL_SERVER_PATH: string
    }
  }
}

export {}
