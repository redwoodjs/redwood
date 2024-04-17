import React from 'react'

import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'

import type { AuthContextInterface } from '@redwoodjs/auth'

globalThis.RWJS_API_GRAPHQL_URL = 'https://api.example.com/graphql'

import { FetchConfigProvider, useFetchConfig } from '../FetchConfigProvider.js'

const FetchConfigToString: React.FunctionComponent = () => {
  const c = useFetchConfig()
  return <>{JSON.stringify(c)}</>
}

type UnkownAuthContext = AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

describe('FetchConfigProvider', () => {
  test('Uri gets passed via fetch config provider', () => {
    render(
      <FetchConfigProvider
        useAuth={() =>
          ({
            loading: false,
            isAuthenticated: false,
          }) as UnkownAuthContext
        }
      >
        <FetchConfigToString />
      </FetchConfigProvider>,
    )

    expect(
      screen.getByText('{"uri":"https://api.example.com/graphql"}'),
    ).toBeInTheDocument()
  })
})
