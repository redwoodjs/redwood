import React from 'react'
import { render } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'

import Routes from '~/web/Routes'

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
