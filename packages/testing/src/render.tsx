import React from 'react'
import { getPaths } from '@redwoodjs/internal'
import { render } from '@testing-library/react'
// @ts-ignore
import { RedwoodProvider } from '@redwoodjs/web'

// Import the user's Router from `./web/src/Router.js`.
// We use the `children` from this Router that are rendered via
// `./MockRouter.Router` so that we can populate the `routes object`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: UserRouterWithRoutes } = require(getPaths().web.routes)

const AllTheProviders: React.FC = ({ children }) => {
  return (
    <RedwoodProvider>
      <UserRouterWithRoutes />
      {children}
    </RedwoodProvider>
  )
}

export const customRender = (ui: any, options = {}) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders {...props} />,
    ...options,
  })
