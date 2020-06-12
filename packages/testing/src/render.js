import React from 'react'
import { getPaths } from '@redwoodjs/internal'
import { render } from '@testing-library/react'
import { RedwoodProvider } from '@redwoodjs/web'

// Import the user's Router from `./web/src/Router.js`.
// We use the `children` from this Router that are rendered via
// `./MockRouter.Router` so that we can populate the `routes object`.
const { default: UserRouterWithRoutes } = require(getPaths().web.routes)

const AllTheProviders = ({ children }) => {
  return (
    <RedwoodProvider>
      <UserRouterWithRoutes />
      {children}
    </RedwoodProvider>
  )
}

export const customRender = (ui, options = {}) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders {...props} />,
    ...options,
  })
