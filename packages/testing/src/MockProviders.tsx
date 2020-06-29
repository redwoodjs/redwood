/**
 * NOTE! This file is imported by Storybook, so it cannot contain any nodejs modules.
 */
import React from 'react'
// ts-ignore
import { RedwoodProvider } from '@redwoodjs/web'

// Import the user's Router from `./web/src/Router.js`,
// we pass the `children` from the user's Router in `./MockRouter.Router`,
// so that we can populate the `routes object` in tests.

// We need to make this work in the context of the browser
// eslint-disable-next-line no-undef
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
