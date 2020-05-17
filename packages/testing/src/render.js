import React from 'react'
import { getPaths } from '@redwoodjs/internal'
import { render } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'

const redwoodPaths = getPaths()

const Routes = require(`${redwoodPaths.web.src}/Routes.js`).default

const AllTheProviders = ({ mocks, children }) => {
  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <>
        <Routes />
        {children}
      </>
    </MockedProvider>
  )
}

export const customRender = (ui, options = {}) =>
  render(ui, {
    wrapper: (props) => <AllTheProviders mocks={options.mocks} {...props} />,
    ...options,
  })
