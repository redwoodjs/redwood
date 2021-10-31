/* eslint-disable no-var */
import type { HelmetData } from 'react-helmet-async'

import type { AuthContextInterface } from '@redwoodjs/auth'

declare global {
  var __REDWOOD__PRERENDERING: boolean
  var __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
  var __REDWOOD__APP_TITLE: string
  var __REDWOOD__USE_AUTH: () => AuthContextInterface

  var RWJS_API_GRAPHQL_URL: string
  /**
   * FQDN or absolute path to the DbAuth serverless function, without the trailing slash.
   * Example: `./redwood/functions/auth` or `https://api.redwoodjs.com/auth`
   **/
  var RWJS_API_DBAUTH_URL: string

  namespace NodeJS {
    interface Global {
      __REDWOOD__PRERENDERING: boolean
      __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
      __REDWOOD__APP_TITLE: string
      __REDWOOD__USE_AUTH: () => AuthContextInterface
    }
  }
}

export {}
