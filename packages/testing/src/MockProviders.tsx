import React from 'react'
// ts-ignore
import { RedwoodProvider } from '@redwoodjs/web'
import { getPaths } from '@redwoodjs/internal'

// Import the user's Router from `./web/src/Router.js`,
// we pass the `children` from the user's Router in `./MockRouter.Router`,
// so that we can populate the `routes object` in tests.
const { default: UserRouterWithRoutes } = require(getPaths().web.routes)

export const MockProviders: React.FunctionComponent = ({ children }) => {
  return (
    <RedwoodProvider>
      <UserRouterWithRoutes />
      {children}
    </RedwoodProvider>
  )
}
