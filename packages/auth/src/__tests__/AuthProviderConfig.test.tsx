import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { createAuthClient } from '../authClients'
import { AuthProvider } from '../AuthProvider'

jest.mock('../authClients', () => {
  return {
    createAuthClient: jest.fn().mockImplementation((...args) => {
      return args
    }),
  }
})

describe('AuthProvider options', () => {
  it('forwards config options to auth client', () => {
    const TestAuthConsumer = () => {
      return null
    }

    render(
      <AuthProvider
        type="dbAuth"
        config={{
          fetchConfig: { credentials: 'include' },
        }}
      >
        <TestAuthConsumer />
      </AuthProvider>
    )

    expect(createAuthClient).toBeCalledWith(undefined, 'dbAuth', {
      fetchConfig: { credentials: 'include' },
    })
  })

  it('does not forward if no config present', () => {
    const TestAuthConsumer = () => {
      return null
    }

    render(
      <AuthProvider type="dbAuth">
        <TestAuthConsumer />
      </AuthProvider>
    )

    expect(createAuthClient).toBeCalledWith(undefined, 'dbAuth', undefined)
  })
})
