import React from 'react'
import { getPaths } from '@redwoodjs/internal'
import { render } from '@testing-library/react'

// Import the user's Router from `./web/src/Router.js`.
// We use the `children` from this Router that are rendered via
// `./MockRouter.Router` so that we can populate the `routes object`.
const { default: UserRouterWithRoutes } = require(getPaths().web.routes)

const AllTheProviders = ({ children }) => {
  return (
    <>
      <UserRouterWithRoutes />
      {children}
    </>
  )
}

export const customRender = (ui, options = {}) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders {...props} />,
    ...options,
  })
