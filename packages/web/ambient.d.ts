import type { HelmetData } from 'react-helmet-async'
import type { AuthContextInterface } from '@redwoodjs/auth'

declare global {
  var __REDWOOD__PRERENDERING: boolean
  var __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
  var __REDWOOD__APP_TITLE: string
  var __REDWOOD__USE_AUTH: () => AuthContextInterface
  var __REDWOOD__API_PROXY_PATH: string

  namespace NodeJS {
    interface Global {
      /**
       * This global is set to true by the prerendering CLI command.
       */
      __REDWOOD__PRERENDERING: boolean
      __REDWOOD__HELMET_CONTEXT: { helmet?: HelmetData }
      __REDWOOD__APP_TITLE: string
      __REDWOOD__USE_AUTH: () => AuthContextInterface
      __REDWOOD__API_PROXY_PATH: string
    }
  }
}

export {}
