/**
 * @jest-environment jsdom
 */

import React from 'react'

import { render, screen, waitFor } from '@testing-library/react'

import type { AuthContextInterface } from '@redwoodjs/auth'
import '@testing-library/jest-dom/extend-expect'

global.RWJS_API_GRAPHQL_URL = 'https://api.example.com/graphql'

import { FetchConfigProvider, useFetchConfig } from './FetchConfigProvider'

const FetchConfigToString: React.FunctionComponent = () => {
  const c = useFetchConfig()
  return <>{JSON.stringify(c)}</>
}

describe('FetchConfigProvider', () => {
  test('Unauthenticated user does not receive headers', () => {
    render(
      <FetchConfigProvider
        useAuth={() =>
          ({
            loading: false,
            isAuthenticated: false,
          } as AuthContextInterface<
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown
          >)
        }
      >
        <FetchConfigToString />
      </FetchConfigProvider>
    )

    expect(
      screen.getByText('{"uri":"https://api.example.com/graphql"}')
    ).toBeInTheDocument()
  })

  test('Authenticated user does receive headers', async () => {
    render(
      <FetchConfigProvider
        useAuth={() =>
          ({
            loading: false,
            isAuthenticated: true,
            type: 'custom',
          } as AuthContextInterface<
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown,
            unknown
          >)
        }
      >
        <FetchConfigToString />
      </FetchConfigProvider>
    )
    await waitFor(() =>
      screen.getByText(
        '{"uri":"https://api.example.com/graphql","headers":{"auth-provider":"custom"}}'
      )
    )
  })
})
