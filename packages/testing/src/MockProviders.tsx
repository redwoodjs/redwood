/**
 * NOTE: This module should not contain any nodejs functionality,
 * because it's also used by Storybook in the browser.
 */
import React from 'react'
// @ts-expect-error
import { RedwoodProvider } from '@redwoodjs/web'

// Import the user's Router from `./web/src/Router.{tsx,js}`,
// we pass the `children` from the user's Router to `./MockRouter.Router`
// so that we can populate the `routes object` in Storybook and tests.
const {
  default: UserRouterWithRoutes,
} = require('~__REDWOOD__USER_ROUTES_FOR_MOCK')

export const MockProviders: React.FunctionComponent = ({ children }) => {
  return (
    <RedwoodProvider>
      <UserRouterWithRoutes />
      {children}
    </RedwoodProvider>
  )
}
