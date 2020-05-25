import React from 'react'
import { getPaths } from '@redwoodjs/internal'
import { render } from '@testing-library/react'

const redwoodPaths = getPaths()

const Routes = require(redwoodPaths.web.src.routes).default

const AllTheProviders = ({ children }) => {
  return (
    <>
      <Routes />
      {children}
    </>
  )
}

export const customRender = (ui, options = {}) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders {...props} />,
    ...options,
  })
